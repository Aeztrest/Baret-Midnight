# Baret for Midnight — Extension (dev)

## Kurulum / Build

```bash
pnpm install   # workspace kökünden
cd apps/extension
node build.mjs   # ./dist üretir
```

## Chrome'da yükleme

1. `chrome://extensions` → "Geliştirici modu" aç.
2. "Paketlenmemiş öğe yükle" → `apps/extension/dist` klasörünü seç.

## Manuel test

`test/mock-dapp.html` gerçek Lace cüzdanını simüle eder (gecikmeli `window.midnight.lace`
ataması dahil — en zor sıralama senaryosu). Yerelde servis edip aç:

```bash
cd apps/extension/test
python3 -m http.server 8899
# tarayıcıda http://127.0.0.1:8899/mock-dapp.html
```

Üç buton: `enable()` (sürtünmesiz geçmeli), `signData(bilinmeyen circuit)` (onay penceresi
açmalı), `signData(bilinen/limit-içi circuit)`.

## Otomatik doğrulama (bu oturumda yapıldı, tekrarlanabilir)

Playwright ile `--load-extension` kullanılarak gerçek Chromium'da uçtan uca doğrulandı:
- `window.midnight.lace` geç (1sn sonra) atansa bile doğru şekilde sarmalanıyor
  (`Object.defineProperty` tuzağı sıralamadan bağımsız çalışıyor — Faz 0'daki açık risk
  **çözüldü**).
- `enable()` sürtünmesiz geçiyor.
- Bilinmeyen circuit → onay penceresi açılıyor, doğru risk metni gösteriliyor, **Onayla**
  gerçek cüzdana iletiyor (dApp gerçek sonucu alıyor), **Reddet** gerçek cüzdana hiç
  ulaşmadan hata döndürüyor.

Script'ler `/tmp/pw-test/` altında kaldı (kalıcı değil, sadece bu oturumun kanıtı).

## Bilinen sınırlamalar / ertelenen işler

- **Derin işlem çözümleme yok**: `signData`/`balanceTransaction`/`submitTransaction` bu
  katmanda opak bir taşıyıcı olarak görünüyor; gerçek `contractAddress`/`circuitId`/`amount`
  alanlarına ulaşmak için Midnight'ın işlem encoding'ini çözen ayrı bir decoder gerekir.
  Şu an `decodeIntent()` best-effort çalışıyor, tanımadığı her şeyi güvenli varsayılan olarak
  "blind sign" riskiyle işaretleyip onaya düşürüyor.
- **Popup (site politikası) UI'ı görsel olarak toolbar-popup bağlamında elle doğrulanmadı**:
  Playwright'ta gerçek `chrome.action` popup'ını ayrı bir sekme olarak açmak "aktif sekme"
  durumunu bozuyor (test artifact'i). Alttaki `chrome.tabs.query` API'si ayrı bir testte
  doğrulandı (host_permissions ile URL görünürlüğü çalışıyor). Gerçek tarayıcıda toolbar
  ikonuna tıklanarak elle bir kez doğrulanmalı.
- **pause/resume/revoke şu an sadece yerel `chrome.storage.local` kaydını günceller.**
  Gerçek Compact `pause`/`resume`/`revoke` circuit çağrısına bağlanması, Faz 0'da bulunan
  donanım kısıtı (ADX) nedeniyle ADX destekli bir ortamda gerçek testnet deploy'u
  yapılabilene kadar erteleniyor (bkz. Faz 6).
