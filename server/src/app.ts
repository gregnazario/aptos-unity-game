// @ts-ignore
import express, {Express, Request, Response} from "express";
// @ts-ignore
import dotenv from 'dotenv';
import {AptosAccount, HexString, Network, Provider} from "aptos";
import {InMemoryDatabase} from "./database";
import {cleanupAddress, serializeSigningMessage, signingMessage} from "./utils";
import {CreateResponse, InventoryResponse, isMintInput, isSwapOrAddInput, toError, UserResponse} from "./types";
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

const runServer = async () => {

    const app = express();
    app.disable('x-powered-by');
    // TODO: Cookie?

    app.use(express.json());


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
        console.log(`/login ${JSON.stringify(body)}`);

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

        // TODO Retrieve inventory
        let inventoryResponse: InventoryResponse = {
            owner: address,
            fighters: [],
            wings: [],
            bodies: [],
        };
        response.send(inventoryResponse);

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