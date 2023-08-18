// @ts-ignore
import express, {Express, NextFunction, Request, Response} from "express";
// @ts-ignore
import dotenv from 'dotenv';
import {AptosAccount, HexString, Network, Provider} from "aptos";
import {InMemoryDatabase} from "./database";
import {cleanupAddress, serializeSigningMessage, signingMessage} from "./utils";
import {
    Balance,
    CreateResponse,
    InventoryResponse, isEndGameInput,
    isMintInput,
    isSwapOrAddInput, PilotInfo,
    toError,
    UserResponse
} from "./types";
import {GameClient, Minter, MODULE_ADDRESS} from "./gameClient";

dotenv.config();

const PORT = process.env.PORT || 8080;

let serverPrivateKey: Uint8Array | undefined;
if (process.env.PRIVATE_KEY) {
    serverPrivateKey = HexString.ensure(process.env.PRIVATE_KEY).toUint8Array();
} else {
    serverPrivateKey = undefined;
}

export const APTOS = new Provider(Network.TESTNET);
export let ACCOUNT = new AptosAccount(serverPrivateKey);
const db = new InMemoryDatabase();
const minter = new Minter(APTOS, ACCOUNT);
const gameClient = new GameClient(APTOS, ACCOUNT);

// TODO Validate account exists

const runServer = async () => {

    const app = express();
    app.disable('x-powered-by');
    // TODO: Cookie?

    app.use(express.json());
    app.use((req: Request, res: Response, next: NextFunction) => {
        let send = res.send;
        res.send = c => {
            console.log(`Req: ${req.url} Code: ${res.statusCode}`);
            res.send = send;
            return res.send(c);
        }
        next();
    });

    // Ensure admin account exists on chain
    await APTOS.getAccount(ACCOUNT.address().hex());

    app.listen(PORT, () => {
        console.log("Starfighter server listening on PORT: ", PORT);
        console.log("Server account address: ", ACCOUNT.address().hex());
        console.log("Connected to network: ", APTOS.network);
        console.log("Module address: ", MODULE_ADDRESS);
    });

    // TODO: Provide actual game status underneath
    app.get("/status", (_, response: Response) => {
        const status = {
            "Status": "Running"
        };

        response.send(status);
    });

    // Creates a session for the user.  Query argument `newSession=true` will delete the previous session first
    app.post("/create", async (request: Request, response: Response) => {
        const {query} = request;
        const address = getAddress(request, response);
        if (!address) {
            return false;
        }

        let newSession = query["newSession"] === "true";
        console.log(`/create ${address} : newSession=${newSession}`);
        try {
            // TODO: Handle current session being too long
            let sessionInfo = db.create(address, newSession);
            let serializedMessage = serializeSigningMessage(signingMessage(sessionInfo));
            let createResponse: CreateResponse = {
                signingMessage: HexString.fromUint8Array(serializedMessage).toString(),
                nonce: sessionInfo.sessionId
            };
            response.send(createResponse);
        } catch (e: any) {
            // TODO: Make 400s better codes
            response.status(400).send(toError(e));
        }
    });

    // Logs in the user and returns an auth nonce
    app.post("/login", async (request: Request, response: Response) => {
        const {body} = request;

        try {
            let nonce = await db.login(body);

            // If we verify the signature, say the login is successful
            let resp = {
                authToken: nonce
            };
            console.log("RESPONSE: {}", resp);
            response.send(resp);
        } catch (e: any) {
            // TODO: Make 400s better codes
            response.status(400).send(toError(e));
        }
    });

    // Retrieves session info for the account (without the auth nonce)
    app.get("/user", async (request: Request, response: Response) => {
        const address = getAddress(request, response);
        if (!address) {
            return;
        }
        console.log(`/user ${address}`);

        try {
            let sessionInfo = db.get(address);

            // Remove the auth nonce
            let userResponse: UserResponse = {
                accountAddress: sessionInfo.accountAddress,
                sessionId: sessionInfo.sessionId,
                loggedIn: sessionInfo.loggedIn,
                timestamp: sessionInfo.timestamp,
            }
            response.send(userResponse);
        } catch (e: any) {
            // TODO: Make 400s better codes
            response.status(400).send(toError(e));
        }
    });

    // Retrieves the inventory for the account
    app.get("/inventory", async (request: Request, response: Response) => {
        const address = getAddress(request, response);
        if (!address) {
            return;
        }
        console.log(`/inventory ${address}`);

        // TODO Cleanup output
        response.send(await gameClient.lookupAccount(address));
    });

    // Retrieves the balance
    app.post("/endGame", async (request: Request, response: Response) => {
        let auth = authenticate(request, response);
        if (!auth.success) {
            return;
        }
        let {body} = request;
        console.log(`/endGame ${auth.address} ${JSON.stringify(body)}`)

        if (!isEndGameInput(body)) {
            response.status(400).send(toError("Invalid end game input"));
            return;
        }

        let hash = await gameClient.endGame(auth.address, body);
        response.send({
            hash: hash
        });
    });

    // Retrieves the balance
    app.get("/balance", async (request: Request, response: Response) => {
        const address = getAddress(request, response);
        if (!address) {
            return;
        }
        console.log(`/balance ${address}`);

        // TODO Retrieve balance
        let balance: Balance = {
            balance: 0
        };
        response.send(balance);

    });

    // Retrieves the pilot records
    app.get("/pilot", async (request: Request, response: Response) => {
        const address = getAddress(request, response);
        if (!address) {
            return;
        }
        console.log(`/pilot ${address}`);

        // TODO: Cleanup with proper type?
        let record = await gameClient.viewPilotRecords(address);

        response.send(record);

    });


    app.post("/mint/pilot", async (request: Request, response: Response) => {
        let auth = authenticate(request, response);
        if (!auth.success) {
            return;
        }
        console.log(`/mint/pilot ${auth.address}`)

        let hash = await minter.mintPilotAndRecords(auth.address);
        response.send({
            hash: hash
        });
    });

    // Mints a random fighter
    app.post("/mint/fighter", async (request: Request, response: Response) => {
        let auth = authenticate(request, response);
        if (!auth.success) {
            return;
        }
        console.log(`/mint/fighter ${auth.address}`)

        let hash = await minter.mintFighter(auth.address);
        response.send({
            hash: hash
        });
    });

    // Mints a random wing
    app.post("/mint/wing", async (request: Request, response: Response) => {
        let auth = authenticate(request, response);
        if (!auth.success) {
            return;
        }
        console.log(`/mint/wing ${auth.address}`);

        let hash = await minter.mintWing(auth.address);
        response.send({
            hash: hash
        });
    });

    // Mints a random body
    app.post("/mint/body", async (request: Request, response: Response) => {
        let auth = authenticate(request, response);
        if (!auth.success) {
            return;
        }
        console.log(`/mint/body ${auth.address}`);

        let hash = await minter.mintBody(auth.address);
        response.send({
            hash: hash
        });
    });

    // Swaps parts for the ship
    app.post("/swap", async (request: Request, response: Response) => {
        let auth = authenticate(request, response);
        if (!auth.success) {
            return;
        }
        const {body} = request;
        console.log(`/swap ${auth.address} ${JSON.stringify(body)}`);

        // Guard wrong input
        if (!isSwapOrAddInput(body)) {
            response.status(400).send(toError("Invalid swap input"));
            return;
        }

        let hash = await gameClient.swapOrAddParts(body);
        response.send({
            hash: hash
        });
    });

    // Logs out of the session and destroys the auth nonce
    app.post("/logout", async (request: Request, response: Response) => {
        let auth = authenticate(request, response);
        if (!auth.success) {
            return;
        }
        console.log(`/logout ${auth.address}`);
        db.delete(auth.address);
    });
}

type AuthenticateResponse = {
    success: boolean,
    address: string,
}

const authenticate = (request: Request, response: Response): AuthenticateResponse => {
    const {query} = request;

    const address = getAddress(request, response);
    if (!address) {
        return {success: false, address: ""};
    }

    let authToken = query["authToken"];
    if (!authToken) {
        response.status(400).send(toError("Missing auth token"));
        return {success: false, address: ""};
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
        return {success: false, address: ""};
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
