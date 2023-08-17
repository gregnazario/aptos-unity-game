// @ts-ignore
import express, {Express, Request, Response} from "express";
// @ts-ignore
import dotenv from 'dotenv';
import {HexString, Network, Provider} from "aptos";
import {InMemoryDatabase} from "./database";
import {cleanupAddress, serializeSigningMessage, signingMessage} from "./utils";

dotenv.config();
const PORT = process.env.PORT || 8080;
const PRIVATE_KEY = process.env.PRIVATE_KEY || undefined;
export const APTOS = new Provider(Network.DEVNET);


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

        let newSession = query["newSession"] === "true";
        try {
            // TODO: Handle current session being too long
            let sessionInfo = db.create(address, newSession);
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