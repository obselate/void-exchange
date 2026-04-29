/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * # Signature Verification Module
 * 
 * This module provides cryptographic signature verification functionality for
 * validating off-chain signed messages on the Sui blockchain. It supports Ed25519
 * digital signature verification, enabling secure authentication of messages
 * signed by external key pairs.
 * 
 * ## Key Features
 * 
 * - Derives Sui addresses from Ed25519 public keys
 * - Verifies Ed25519 signatures against expected addresses
 * - Validates message integrity using Sui's PersonalMessage intent protocol
 * - Supports Sui's signature format (flag + signature + public key)
 * 
 * ## Use Cases
 * 
 * This module is essential for scenarios requiring proof of ownership or
 * authorization, such as:
 * 
 * - Verifying that a message was signed by a specific account holder
 * - Authenticating off-chain actions before executing on-chain operations
 * - Validating location proofs or other attestations signed externally
 * 
 * ## Implementation Reference
 * 
 * Based on the Sui off-chain message signing pattern described at:
 * https://medium.com/@gfusee33/signing-sui-off-chain-messages-and-verifying-them-on-chain-using-move-e6c5108a04e7
 */

import { type Transaction } from '@mysten/sui/transactions';
import { normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
export interface DeriveAddressFromPublicKeyArguments {
    publicKey: RawTransactionArgument<Array<number>>;
}
export interface DeriveAddressFromPublicKeyOptions {
    package?: string;
    arguments: DeriveAddressFromPublicKeyArguments | [
        publicKey: RawTransactionArgument<Array<number>>
    ];
}
export function deriveAddressFromPublicKey(options: DeriveAddressFromPublicKeyOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        'vector<u8>'
    ] satisfies (string | null)[];
    const parameterNames = ["publicKey"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'sig_verify',
        function: 'derive_address_from_public_key',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface VerifySignatureArguments {
    message: RawTransactionArgument<Array<number>>;
    signature: RawTransactionArgument<Array<number>>;
    expectedAddress: RawTransactionArgument<string>;
}
export interface VerifySignatureOptions {
    package?: string;
    arguments: VerifySignatureArguments | [
        message: RawTransactionArgument<Array<number>>,
        signature: RawTransactionArgument<Array<number>>,
        expectedAddress: RawTransactionArgument<string>
    ];
}
export function verifySignature(options: VerifySignatureOptions) {
    const packageAddress = options.package ?? '@local-pkg/world';
    const argumentsTypes = [
        'vector<u8>',
        'vector<u8>',
        'address'
    ] satisfies (string | null)[];
    const parameterNames = ["message", "signature", "expectedAddress"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'sig_verify',
        function: 'verify_signature',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}