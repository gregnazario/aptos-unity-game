import {AptosAccount, Provider} from "aptos";
import {EndGameInput, MintInput, SwapOrAddInput} from "./types";
import {
    entryFunctionPayload,
    randomIndex,
    serializeAddress,
    serializeOptionalAddress, serializeOptionalString,
    serializeStr,
    serializeU64
} from "./utils";
import {BODIES, FIGHTERS, WINGS} from "./assets";

export const MODULE_ADDRESS = "0xcbe965f307860ed268ec1820534d2395c8fc0941059128398567228de5cecef6"

const COMPOSED_NFTS = "query GetComposedNFTs($address:string!) {\n" +
    "  current_token_ownerships_v2(\n" +
    "    where: {owner_address: {_eq: $address}, amount: {_gt: \"0\"}}\n" +
    "  ) {\n" +
    "      current_token_data {\n" +
    "      token_name\n" +
    "    }\n" +
    "    composed_nfts(where: {amount: {_gt: \"0\"}}) {\n" +
    "      current_token_data {\n" +
    "        token_name\n" +
    "      }\n" +
    "    }\n" +
    "  }\n" +
    "}"

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

    async mintPilotAndRecords(
        address: string
    ): Promise<string> {
        let payload = entryFunctionPayload(
            MODULE_ADDRESS,
            "records_nfts",
            "mint_pilot_and_records",
            [
                serializeAddress(address),
            ]
        );
        let txn = await this.provider.generateSignSubmitWaitForTransaction(this.account, payload)
        return txn.hash;
    }

    async mint(
        functionName: string,
        input: MintInput
    ): Promise<string> {
        let payload = entryFunctionPayload(
            MODULE_ADDRESS,
            "composable_nfts",
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

    async setPilotName(account: string, pilotAddress: string, name: string | undefined): Promise<string> {
        let payload = entryFunctionPayload(
            MODULE_ADDRESS,
            "records_nfts",
            "set_pilot_aptos_name",
            [
                serializeAddress(account),
                serializeAddress(pilotAddress),
                serializeOptionalString(name),
            ]
        );

        // TODO: Use the new transaction processor
        let txn = await this.provider.generateSignSubmitWaitForTransaction(this.account, payload)
        return txn.hash;
    }

    async setPilotAvatar(account: string, pilotAddress: string, token: string | undefined): Promise<string> {
        let payload = entryFunctionPayload(
            MODULE_ADDRESS,
            "records_nfts",
            "set_pilot_aptos_avatar_v2",
            [
                serializeAddress(account),
                serializeAddress(pilotAddress),
                serializeOptionalAddress(token),
            ]
        );

        // TODO: Use the new transaction processor
        let txn = await this.provider.generateSignSubmitWaitForTransaction(this.account, payload)
        return txn.hash;
    }

    async lookupAccount(account: string): Promise<any> {
        return this.provider.queryIndexer({
            query: COMPOSED_NFTS,
            variables: {
                address: account
            }
        });
    }

    async viewPilotRecords(account: string) {
        let ret = await this.provider.view({
            function: `${MODULE_ADDRESS}::records_nfts::view_pilot_records_v2`,
            type_arguments: [],
            arguments: [account],
        })

        let value = (ret[0] as {
            aptos_name: string | undefined,
            avatar: string | undefined,
            games_played: bigint,
            longest_survival_ms: bigint,
        });
        let aptosName: string | undefined = value["aptos_name"];
        let avatar: string | undefined = value["avatar"];
        let gamesPlayed: bigint = value["games_played"];
        let longestSurvival: bigint = value["longest_survival_ms"];

        return {
            aptosName: aptosName,
            avatar: avatar,
            gamesPlayed: gamesPlayed,
            longestSurvival: longestSurvival,
        }
    }

    async viewBalance(account: string) {
        let ret = await this.provider.view({
            function: `0x1::coin::balance`,
            type_arguments: ["0x1::aptos_coin::AptosCoin"],
            arguments: [account],
        })

        let value = Number(ret[0] as string)

        return value;
    }

    async swapOrAddParts(
        input: SwapOrAddInput
    ): Promise<string> {
        let payload = entryFunctionPayload(
            MODULE_ADDRESS,
            "composable_nfts",
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

    async endGame(address: string, endGameInput: EndGameInput): Promise<string> {
        let payload = entryFunctionPayload(
            MODULE_ADDRESS,
            "records_nfts",
            "save_game_result",
            [
                serializeAddress(address),
                serializeAddress(endGameInput.pilot),
                serializeU64(endGameInput.gameTime),
            ]
        );

        // TODO: Use the new transaction processor
        let txn = await this.provider.generateSignSubmitWaitForTransaction(this.account, payload)
        return txn.hash;
    }
}
