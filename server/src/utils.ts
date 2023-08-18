// @ts-ignore
import nacl from "tweetnacl";
import {BCS, TxnBuilderTypes} from "aptos";
import {SessionInfo, SigningMessage} from "./types";

export const signingMessage = (sessionInfo: SessionInfo): SigningMessage => {
    return {
        accountAddress: sessionInfo.accountAddress,
        sessionId: sessionInfo.sessionId,
        timestamp: sessionInfo.timestamp
    }
}

export const serializeSigningMessage = (signingMessage: SigningMessage): Uint8Array => {
    let serializer = new BCS.Serializer();
    serializer.serializeStr(signingMessage.accountAddress);
    serializer.serializeStr(signingMessage.sessionId);
    serializer.serializeU64(signingMessage.timestamp);

    // Ensure to hash the bytes so it's always the same length
    let bytes = serializer.getBytes();
    return nacl.hash(bytes);
}


export const cleanupAddress = (accountAddress: string): string => {
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

export const entryFunctionPayload = (
    moduleAddress: string,
    moduleName: string,
    functionName: string,
    args: Uint8Array[],
): TxnBuilderTypes.TransactionPayloadEntryFunction => {
    return new TxnBuilderTypes.TransactionPayloadEntryFunction(
        TxnBuilderTypes.EntryFunction.natural(
            `${moduleAddress}::${moduleName}`,
            functionName,
            [],
            args,
        ));
}

// TODO: This should be part of the SDK
export const serializeAddress = (input: string): Uint8Array => {
    return BCS.bcsToBytes(TxnBuilderTypes.AccountAddress.fromHex(input));
}
export const serializeStr = (input: string): Uint8Array => {
    return BCS.bcsSerializeStr(input);
}

// TODO: This is really not good for optional addresses
export const serializeOptionalAddress = (input: string | undefined | null): Uint8Array => {
    // All falsy is fine, since it must be a full address
    if (!input) {
        return BCS.serializeVectorWithFunc([], "serializeFixedBytes");
    } else {
        let address = TxnBuilderTypes.AccountAddress.fromHex(input);
        return BCS.serializeVectorWithFunc([address.address], "serializeFixedBytes");
    }
}

// TODO: This is really not good for optional addresses
export const serializeOptionalString = (input: string | undefined | null): Uint8Array => {
    if (input === null || input === undefined) {
        return BCS.serializeVectorWithFunc([], "serializeStr");
    } else {
        return BCS.serializeVectorWithFunc([input], "serializeStr");
    }
}

// TODO: Why aren't these just U64
export const serializeU64 = (input: number): Uint8Array => {
    return BCS.bcsSerializeUint64(input);
}

export const randomIndex = (length: number): number => {
    return (Math.floor(Math.random() * length));
}