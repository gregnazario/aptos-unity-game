import {AptosAccount, BCS, Provider, TxnBuilderTypes} from "aptos";
import {MintInput, SwapOrAddInput} from "./types";
import {
    entryFunctionPayload,
    randomIndex,
    serializeAddress,
    serializeOptionalAddress,
    serializeStr,
    serializeU64
} from "./utils";
import {BODIES, FIGHTERS, WINGS} from "./assets";

export const MODULE_ADDRESS = "0x72051a1da89698e7cf185d8e1e6a2c9a8835337d3d7015f97f054e2e4864d15a"
const MODULE_NAME = "composable_nfts"

export class Minter {
    private readonly account: AptosAccount;
    private readonly provider: Provider;

    constructor(provider: Provider, account: AptosAccount) {
        this.account = account;
        this.provider = provider;
    }

    async mintFighter(
        address: string,
    ): Promise<string> {
        let info = FIGHTERS[randomIndex(FIGHTERS.length)];
        let input: MintInput = {
            destination_address: address,
            health: info.health,
            speed: info.speed,
            token_description: info.token_description,
            token_name: info.token_name,
            token_uri: info.token_uri
        };
        return await this.mint("mint_fighter", input);
    }

    async mintWing(
        address: string,
    ): Promise<string> {
        let info = WINGS[randomIndex(WINGS.length)];
        let input: MintInput = {
            destination_address: address,
            health: info.health,
            speed: info.speed,
            token_description: info.token_description,
            token_name: info.token_name,
            token_uri: info.token_uri
        };
        return await this.mint("mint_wing", input);
    }

    async mintBody(
        address: string,
    ): Promise<string> {
        let info = BODIES[randomIndex(BODIES.length)];
        let input: MintInput = {
            destination_address: address,
            health: info.health,
            speed: info.speed,
            token_description: info.token_description,
            token_name: info.token_name,
            token_uri: info.token_uri
        };
        return await this.mint("mint_body", input);
    }

    async mint(
        functionName: string,
        input: MintInput
    ): Promise<string> {
        let payload = entryFunctionPayload(
            MODULE_ADDRESS,
            MODULE_NAME,
            functionName,
            [
                serializeAddress(input.destination_address),
                serializeStr(input.token_name),
                serializeStr(input.token_description),
                serializeStr(input.token_uri),
                serializeU64(input.health),
                serializeU64(input.speed),
            ]
        );

        // TODO: Use the new transaction processor
        let txn = await this.provider.generateSignSubmitWaitForTransaction(this.account, payload)
        return txn.hash;
    }
}

export class GameClient {
    private readonly account: AptosAccount;
    private readonly provider: Provider;

    constructor(provider: Provider, account: AptosAccount) {
        this.account = account;
        this.provider = provider;
    }

    async swapOrAddParts(
        input: SwapOrAddInput
    ): Promise<string> {
        let payload = entryFunctionPayload(
            MODULE_ADDRESS,
            MODULE_NAME,
            "swap_or_add_parts",
            [
                serializeAddress(input.owner),
                serializeAddress(input.fighter),
                serializeOptionalAddress(input.wing),
                serializeOptionalAddress(input.body),
            ]
        );

        // TODO: Use the new transaction processor
        let txn = await this.provider.generateSignSubmitWaitForTransaction(this.account, payload)
        return txn.hash;
    }

}
