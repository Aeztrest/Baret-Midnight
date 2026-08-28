import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";
import { fileURLToPath } from "node:url";
import path from "node:path";

export * from "../../managed/merchant-spend-policy/contract/index.js";
export * from "./witnesses.js";

import * as CompiledMerchantSpendPolicy from "../../managed/merchant-spend-policy/contract/index.js";
import * as Witnesses from "./witnesses.js";

// Absolute path to contracts/merchant-spend-policy/managed/merchant-spend-policy, computed from
// this file's own location to avoid any ambiguity about cwd-relative vs. file-relative resolution.
const compiledFileAssetsPath = path.resolve(
  fileURLToPath(import.meta.url),
  "..",
  "..",
  "..",
  "managed",
  "merchant-spend-policy",
);

export function commitmentFor(role: "owner" | "signer", sk: Uint8Array): Uint8Array {
  return role === "owner"
    ? CompiledMerchantSpendPolicy.pureCircuits.ownerCommitmentOf(sk)
    : CompiledMerchantSpendPolicy.pureCircuits.signerCommitmentOf(sk);
}

export const CompiledMerchantSpendPolicyContract = CompiledContract.make<
  CompiledMerchantSpendPolicy.Contract<Witnesses.PolicyPrivateState>
>("MerchantSpendPolicy", CompiledMerchantSpendPolicy.Contract<Witnesses.PolicyPrivateState>).pipe(
  CompiledContract.withWitnesses(Witnesses.witnesses),
  CompiledContract.withCompiledFileAssets(compiledFileAssetsPath),
);
