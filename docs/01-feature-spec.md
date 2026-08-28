# Özellik ve Mimari Spesifikasyonu

Bu doküman, Baret'in Midnight ağı için tasarlanan özelliklerini ve mimari kararlarını tanımlar.
Amaç: cüzdan seviyesinde bir imza öncesi risk analizi + harcama politikası güvenlik duvarı —
Midnight'ın kendi kavramlarıyla (Ledger / Circuit / Witness / dApp Connector) uçtan uca tasarlanmış.

## 1. Risk Dedektörleri

- **Blind sign riski**: Çağrılan circuit'in bilinen/whitelist'li bir contract-address + circuit-id kombinasyonu olup olmadığını kontrol eder; tanınmayan her çağrı güvenli varsayılan olarak işaretlenir.
- **Sınırsız yetki riski (approval drainer)**: Sınırsız/aşırı yüksek harcama yetkisi isteyen politika güncellemelerini yakalar.
- **Agentic x402 riski**: Bir AI ajanının kullanıcı onayı olmadan otomatik mikro-ödeme yapmasını işaretler.
- **Bakiye delta simülasyonu**: İşlem sonrası public ledger'da hangi state alanlarının nasıl değişeceğini simüle edip özetler (dApp Connector API'nin `balanceTransaction` adımına karşılık gelir).
- **Kontrat etkileşimleri izleme**: İşlemin zincirleme olarak hangi diğer sözleşmeleri çağırdığını listeler.
- **Disclosure dedektörü**: İmzalanacak circuit çağrısının hangi witness (private) verisini `disclose()` ile public ledger'a yazdığını, kime görünür kıldığını özetler — Midnight'ın "private by default" modeline özgü bir risk kategorisi.
- **Proving-mode bildirimi**: İşlemin ZK kanıtının kullanıcının kendi cihazında mı yoksa harici bir proof server'da (delegated) mı üretileceğini bildirir.

## 2. Politika Defteri — `merchant-spend-policy` Compact Sözleşmesi

**Ledger** (public, on-chain state):

| Alan | Tip | Açıklama |
|---|---|---|
| `status` | `PolicyStatus` (ACTIVE/PAUSED/REVOKED) | Politikanın durumu |
| `ownerCommitment` | `Bytes<32>` | Politika sahibinin gizli anahtar taahhüdü (commitment) |
| `signerCommitment` | `Bytes<32>` | Yetkili alt-imzacının gizli anahtar taahhüdü |
| `merchant` | `Bytes<32>` | Tüccar/hedef kimliği |
| `capPerTx` | `Uint<64>` | İşlem başına harcama limiti |
| `capPerDay` | `Uint<64>` | Dönem (gün) başına harcama limiti |
| `mandateSeconds` | `Uint<64>` | İzin geçerlilik süresi |
| `periodStart` | `Uint<64>` | Mevcut dönemin başlangıç zamanı |
| `spentThisPeriod` | `Uint<64>` | Mevcut dönemde harcanan tutar |

**Witnesses** (private, off-chain): `ownerSecretKey()`, `signerSecretKey()`, `currentTime()`. Sahiplik/yetki kontrolü, açık anahtar karşılaştırması yerine **commitment şeması** ile yapılır (`persistentHash` tabanlı) — bu, ZK devrelerinde kimlik doğrulamanın güvenli yolu (bkz. `ownPublicKey()`'in neden kimlik kanıtlamak için yetersiz olduğuna dair Compact ekosistemindeki bilinen uyarı).

**Circuits**: `setPolicy`, `authorizeSpend` (limit kontrolü + dönem sıfırlama), `pause`, `resume`, `revoke`.

## 3. x402 Ödeme Akışı

1. **İstek**: Sayfadaki `fetch()` HTTP 402 alır.
2. **Çözümleme**: Uzantı `PaymentRequirements`'i dekode eder.
3. **Politika Değerlendirmesi**: Risk motoru + `authorizeSpend` circuit'inin sonucuna göre karar verilir.
4. **Karar**: Limit içinde → arka planda circuit çağrısı hazırlanır (popup yok); şüpheli/limit dışı → RiskPreview + disclosure özeti gösterilir, kullanıcı onayı beklenir.
5. **İmza**: `@midnight-ntwrk/dapp-connector-api`'nin `balanceTransaction` + `signData`/`submitTransaction` akışıyla circuit çağrısı imzalanır (proof lokal veya delegated üretilebilir).
6. **Gönderme**: `PAYMENT-SIGNATURE` header'ıyla sunucuya iletilir.
7. **Kolaylaştırma (facilitator)**: Kendi Midnight-native facilitator'ımız (`apps/server`), gelen imzalı circuit çağrısını doğrulayıp Midnight ağına submit eder.
8. **Yerleşim**: İşlem zincire iner, explorer linki döndürülür.

## 4. Monorepo Paket Yapısı

| Paket | Sorumluluk |
|---|---|
| `apps/extension` | Chrome/Firefox MV3 cüzdan güvenlik duvarı uzantısı |
| `apps/server` | Fastify: `/v1/analyze` (risk analizi) + `/x402/*` (facilitator) |
| `packages/policy-engine` | Risk dedektörleri + politika DSL, zincirden bağımsız |
| `contracts/merchant-spend-policy` | Compact sözleşmesi + proof-free entegrasyon testleri |

## 5. Kapsam Dışı / Ertelenen

- Gerçek ZK proof üretimi ve testnet deploy'u: geliştirme makinesinin donanım kısıtı nedeniyle (ADX komut seti eksikliği) ADX destekli bir ortam (bkz. Render deploy'u) netleşene kadar ertelendi. Sözleşme mantığı, `@midnight-ntwrk/compact-runtime`'ın state-transition API'leri üzerinden proof üretmeden ama **gerçek derlenmiş Compact koduna karşı** test ediliyor.
