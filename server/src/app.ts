// @ts-ignore
import express, {Express, Request, Response} from "express";
// @ts-ignore
import dotenv from 'dotenv';
import {AptosAccount, HexString, Network, Provider} from "aptos";
import {InMemoryDatabase} from "./database";
import {cleanupAddress, serializeSigningMessage, signingMessage} from "./utils";
import {toError} from "./types";

dotenv.config();

const PORT = process.env.PORT || 8080;

let serverPrivateKey: Uint8Array | undefined;
if (process.env.PRIVATE_KEY) {
    serverPrivateKey = HexString.ensure(process.env.PRIVATE_KEY).toUint8Array();
} else {
    serverPrivateKey = undefined;
}

export const APTOS = new Provider(Network.DEVNET);
export let ACCOUNT = new AptosAccount(serverPrivateKey);
const db = new InMemoryDatabase();

const runServer = async () => {

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
        const address = getAddress(request, response);
        if (!address) {
            return false;
        }

        let newSession = query["newSession"] === "true";
        try {
            // TODO: Handle current session being too long
            let sessionInfo = db.create(address, newSession);
            let serializedMessage = serializeSigningMessage(signingMessage(sessionInfo));
            response.send({
                signingMessage: HexString.fromUint8Array(serializedMessage).toString()
            });
        } catch (e: any) {
            // TODO: Make 400s better codes
            response.status(400).send(toError(e));
        }
    });

    app.post("/login", async (request: Request, response: Response) => {
        const {body} = request;

        try {
            let nonce = db.login(body);

            // If we verify the signature, say the login is successful
            response.status(200).send({
                authToken: nonce
            });
        } catch (e: any) {
            // TODO: Make 400s better codes
            response.status(400).send(toError(e));
        }
    });

    app.get("/user", async (request: Request, response: Response) => {
        const address = getAddress(request, response);
        if (!address) {
            return;
        }

        try {
            let sessionInfo = db.get(address);

            // Remove the auth nonce
            let ret = {
                accountAddress: sessionInfo.accountAddress,
                sessionId: sessionInfo.sessionId,
                loggedIn: sessionInfo.loggedIn,
                timestamp: sessionInfo.timestamp,
            }
            response.send(ret);
        } catch (e: any) {
            // TODO: Make 400s better codes
            response.status(400).send(toError(e));
        }
    });

    app.get("/mint", async (request: Request, response: Response) => {
        let auth = authenticate(request, response);
        if (!auth.success) {
            return;
        }
        // TODO add minting

    });

    app.get("/logout", async (request: Request, response: Response) => {
        let auth = authenticate(request, response);
        if (!auth.success) {
            return;
        }
        db.delete(auth.address!);
    });
}

type AuthenticateResponse = {
    success: boolean,
    address?: string,
}

const authenticate = (request: Request, response: Response): AuthenticateResponse => {
    const {query} = request;

    const address = getAddress(request, response);
    if (!address) {
        return {success: false};
    }

    let authToken = query["authToken"];
    if (!authToken) {
        response.status(400).send(toError("Missing auth token"));
        return {success: false};
    }
    try {
        let sessionInfo = db.get(address);
        if (!sessionInfo.loggedIn) {
            response.status(403).send(toError("User not logged in"));
        }
        if (sessionInfo.authNonce !== authToken) {
            response.status(403).send(toError("Invalid auth token"));
        }
        return {success: true, address: address};
    } catch (e: any) {
        // TODO: Make 400s better codes
        response.status(400).send(toError(e));
        return {success: false};
    }
}

const getAddress = (request: Request, response: Response): string | undefined => {
    const {query} = request;

    let accountAddress = query["accountAddress"];
    if (!accountAddress) {
        response.status(400).send(toError("Missing account address"));
        return undefined;
    }

    try {
        return cleanupAddress(accountAddress.toString());
    } catch (e: any) {
        response.status(400).send(toError(e));
        return undefined;
    }
}

runServer();