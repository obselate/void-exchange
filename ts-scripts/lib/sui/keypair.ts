/**
 * Keypair loading helpers.
 *
 * The codebase only supports Ed25519 (matches the dapp wallet defaults).
 * Private keys are expected in the Sui Bech32 `suiprivkey1...` format produced
 * by `sui keytool export`.
 *
 * Reference: https://sdk.mystenlabs.com/typescript/cryptography/keypairs
 */
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";

/**
 * Decode a Sui-format private key (`suiprivkey1...`) into an Ed25519 keypair.
 * Throws if the key uses a different signature scheme.
 */
export function keypairFromPrivateKey(privateKey: string): Ed25519Keypair {
    const { scheme, secretKey } = decodeSuiPrivateKey(privateKey);
    if (scheme !== "ED25519") {
        throw new Error(`Unsupported key scheme: ${scheme}. Only ED25519 is supported.`);
    }
    return Ed25519Keypair.fromSecretKey(secretKey);
}

/**
 * Load a keypair from an environment variable.
 *
 * @param varName - env var holding a Sui-format private key
 * @example
 *   const kp = keypairFromEnv("ADMIN_PRIVATE_KEY");
 */
export function keypairFromEnv(varName: string): Ed25519Keypair {
    const value = process.env[varName];
    if (!value) {
        throw new Error(`${varName} is required but not set in the environment.`);
    }
    return keypairFromPrivateKey(value);
}
