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
