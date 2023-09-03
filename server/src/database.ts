// @ts-ignore
import nacl from "tweetnacl";
import {randomUUID} from "crypto";
import {HexString, TxnBuilderTypes} from "aptos";
import {LoginRequest, SessionInfo, Signature, SigningMessage} from "./types";
import {cleanupAddress, serializeSigningMessage, signingMessage} from "./utils";
import {APTOS} from "./app";

const FIVE_MINUTES = 300_000;

export interface Database {
    create(accountAddress: string, deleteExisting: boolean): SessionInfo;

    login(signature: Signature): Promise<string>;

    get(accountAddress: string): SigningMessage;

    delete(accountAddress: string): void;
}

// TODO: Replace with a real database
// TODO: Use account address 32 bytes instead of the string
export class InMemoryDatabase implements Database {
    private db = new Map<string, SessionInfo>()

    create(accountAddress: string, deleteExisting: boolean): SessionInfo {
        let address = cleanupAddress(accountAddress);

        let currentSession = this.db.get(address);
        if (currentSession) {
            // Optionally delete previous session (TBD determine if we want idempotency by default)
            if (!deleteExisting) {
                return currentSession;
            }

            this.db.delete(address);
        }

        let newSession: SessionInfo = {
            accountAddress: address,
            sessionId: randomUUID(),
            loggedIn: false,
            timestamp: Date.now(),
            authNonce: randomUUID(),
        };
        this.db.set(address, newSession);
        return newSession;
    }

    async login(request: LoginRequest): Promise<string> {
        let address = cleanupAddress(request.accountAddress);
        let currentSession: SessionInfo | undefined = this.db.get(address);
        if (currentSession) {
            // Login must have been within 5 minutes
            let now = Date.now();
            if ((currentSession.timestamp + FIVE_MINUTES) < now) {
                throw new Error(`Session too old, please create a new session: '${address}'`)
            }

            // Let's not check for signature validity :)

            // Convert public key
            let publicKeyBytes: Uint8Array;
            let ed25519PublicKey: TxnBuilderTypes.Ed25519PublicKey;
            try {
                publicKeyBytes = HexString.ensure(request.publicKey).toUint8Array();
                ed25519PublicKey = new TxnBuilderTypes.Ed25519PublicKey(publicKeyBytes)
            } catch (error: any) {
                throw new Error(`Invalid public key for session: '${request.publicKey}'`)
            }

            // Signature must be valid
            let message = signingMessage(currentSession);
            let serializedMessage = serializeSigningMessage(message);

            if (!nacl.sign.detached.verify(serializedMessage, HexString.ensure(request.signature).toUint8Array(), publicKeyBytes)) {
                throw new Error(`Invalid signature for session: '${address}'`)
            }

            // Auth key must match public key
            let account = await APTOS.getAccount(address);
            let auth_key = TxnBuilderTypes.AuthenticationKey.fromEd25519PublicKey(ed25519PublicKey)
            if (HexString.ensure(account.authentication_key).hex() !== HexString.fromUint8Array(auth_key.bytes).hex()) {
                throw new Error(`Invalid authentication key for session: '${address}' expected ${account.authentication_key} got ${HexString.fromUint8Array(auth_key.bytes).hex()}`)
            }

            // If all pass, then authenticated
            currentSession.loggedIn = true;
            return currentSession.authNonce;
        } else {
            throw new Error(`Session not found for account address: '${address}'`);
        }
    }

    delete(accountAddress: string): void {
        let address = cleanupAddress(accountAddress);
        this.db.delete(address);
    }

    get(accountAddress: string): SessionInfo {
        let address = cleanupAddress(accountAddress);
        let currentSession: SessionInfo | undefined = this.db.get(address);
        if (currentSession) {
            return currentSession;
        } else {
            throw new Error(`Session not found for account address: '${address}'`);
        }
    }
}
