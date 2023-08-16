// @ts-ignore
import express, {Express, Request, Response} from "express";
// @ts-ignore
import dotenv from 'dotenv';
import {randomUUID} from "crypto";
import {TxnBuilderTypes} from "aptos";

dotenv.config();
const PORT = process.env.PORT || 8080;
const PRIVATE_KEY = process.env.PRIVATE_KEY || undefined;

/**
 * The session information to be signed by the wallet
 */
type SessionInfo = {
    accountAddress: string,
    sessionId: string,
};

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
    create(accountAddress: string): SessionInfo;

    get(accountAddress: string): SessionInfo;

    delete(accountAddress: string): void;
}

// TODO: Replace with a real database
// TODO: Use account address 32 bytes instead of the string
class InMemoryDatabase implements Database {
    private db = new Map<string, SessionInfo>()

    create(accountAddress: string): SessionInfo {
        let address = cleanupAddress(accountAddress);
        // If a session already exists, keep it (TBD replacing the previous session)
        let currentSession = this.db.get(address);
        if (currentSession) {
            return currentSession;
        }
        let newSession: SessionInfo = {
            accountAddress: address,
            sessionId: randomUUID()
        };
        this.db.set(address, newSession);
        return newSession;
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
            throw new Error(`
        Session
        not
        found
        for account address: '${address}'`);
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

        // TODO: verify account address format
        try {
            let sessionInfo = db.create(accountAddress.toString());
            response.send(sessionInfo);
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