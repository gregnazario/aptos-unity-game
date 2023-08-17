// @ts-ignore
import express, {Express, Request, Response} from "express";
// @ts-ignore
import dotenv from 'dotenv';
import {randomUUID} from "crypto";
import {BCS, HexString, Network, Provider, TxnBuilderTypes} from "aptos";
// @ts-ignore
import nacl from "tweetnacl";

dotenv.config();
const PORT = process.env.PORT || 8080;
const PRIVATE_KEY = process.env.PRIVATE_KEY || undefined;
const FIVE_MINUTES = 300_000;
type SessionInfo = {
    accountAddress: string,
    sessionId: string,
    timestamp: number,
    loggedIn: boolean,
    authNonce: string,
};

type SigningMessage = {
    accountAddress: string,
    sessionId: string,
    timestamp: number,
};

type Signature = {
    accountAddress: string,
    signature: string,
    publicKey: string,
}

const APTOS = new Provider(Network.DEVNET);

const signingMessage = (sessionInfo: SessionInfo): SigningMessage => {
    return {
        accountAddress: sessionInfo.accountAddress,
        sessionId: sessionInfo.sessionId,
        timestamp: sessionInfo.timestamp
    }
}

const serializeSigningMessage = (signingMessage: SigningMessage): Uint8Array => {
    let serializer = new BCS.Serializer();
    serializer.serializeStr(signingMessage.accountAddress);
    serializer.serializeStr(signingMessage.sessionId);
    serializer.serializeU64(signingMessage.timestamp);

    // Ensure to hash the bytes so it's always the same length
    let bytes = serializer.getBytes();
    return nacl.hash(bytes);
}

const cleanupAddress = (accountAddress: string): string => {
    try {
        // TODO: this function doesn't work well, both errors and boolean is returned
        if (!TxnBuilderTypes.AccountAddress.isValid(accountAddress)) {
            throw new Error(`Invalid address format`);
        }
    } catch (e: any) {
        throw new Error(`Invalid account address: '${accountAddress}' - ${e.message}`);
    }

    return TxnBuilderTypes.AccountAddress.standardizeAddress(accountAddress);
}

interface Database {
    create(accountAddress: string, deleteExisting: boolean): SessionInfo;

    login(signature: Signature): Promise<string>;

    get(accountAddress: string): SessionInfo;

    delete(accountAddress: string): void;
}

// TODO: Replace with a real database
// TODO: Use account address 32 bytes instead of the string
class InMemoryDatabase implements Database {
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

    async login(signature: Signature): Promise<string> {
        let address = cleanupAddress(signature.accountAddress);
        let currentSession: SessionInfo | undefined = this.db.get(address);
        if (currentSession) {
            // Login must have been within 5 minutes
            let now = Date.now();
            if ((currentSession.timestamp + FIVE_MINUTES) < now) {
                throw new Error(`Session too old, please create a new session: '${address}'`)
            }

            // Convert public key
            let publicKeyBytes: Uint8Array;
            let ed25519PublicKey: TxnBuilderTypes.Ed25519PublicKey;
            try {
                publicKeyBytes = HexString.ensure(signature.publicKey).toUint8Array();
                ed25519PublicKey = new TxnBuilderTypes.Ed25519PublicKey(publicKeyBytes)
            } catch (error: any) {
                throw new Error(`Invalid public key for session: '${signature.publicKey}'`)
            }

            // Signature must be valid
            let message = signingMessage(currentSession);
            let serializedMessage = serializeSigningMessage(message);

            if (nacl.sign.detached.verify(serializedMessage, HexString.ensure(signature.signature).toUint8Array(), publicKeyBytes)) {
                throw new Error(`Invalid signature for session: '${address}'`)
            }

            // Account Address must match key
            let account = await APTOS.getAccount(address);
            TxnBuilderTypes.AuthenticationKey.fromEd25519PublicKey(ed25519PublicKey)


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

const runServer = async () => {
    let db = new InMemoryDatabase();

    const app = express();
    app.disable('x-powered-by');
    // TODO: Cookie?

    app.use(express.json());


    app.listen(PORT, () => {
        console.log("Starfighter server listening on PORT: ", PORT);
    });

    // TODO: Provide actual game status underneath
    app.get("/status", (_, response: Response) => {
        const status = {
            "Status": "Running"
        };

        response.send(status);
    });

    // TODO: Make post instead of get
    app.get("/create", async (request: Request, response: Response) => {
        const {query} = request;
        let accountAddress = query["accountAddress"];
        if (!accountAddress) {
            response.status(400).send("Missing account address");
            return;
        }
        let address = cleanupAddress(accountAddress.toString());

        try {
            // TODO: Handle current session being too long
            let sessionInfo = db.create(address, false);
            let serializedMessage = serializeSigningMessage(signingMessage(sessionInfo));
            response.send(HexString.fromUint8Array(serializedMessage).toString());
        } catch (e: any) {
            // TODO: Make 400s better codes
            response.status(400).send(e.message);
        }
    });

    app.post("/login", async (request: Request, response: Response) => {
        const {body} = request;

        try {
            let nonce = db.login(body);

            // TODO: Stronger type the output once we've settled on it
            let res = {
                authToken: nonce
            };

            // If we verify the signature, say the login is successful
            response.status(200).send(res);
        } catch (e: any) {
            // TODO: Make 400s better codes
            response.status(400).send(e.message);
        }
    });

    app.get("/user", async (request: Request, response: Response) => {
        const {query} = request;
        let accountAddress = query["accountAddress"];
        if (!accountAddress) {
            response.status(400).send("Missing account address");
            return;
        }
        try {
            let sessionInfo = db.get(accountAddress.toString());
            response.send(sessionInfo);
        } catch (e: any) {
            // TODO: Make 400s better codes
            response.status(400).send(e.message);
        }
    });
}

runServer();