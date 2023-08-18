export type SessionInfo = {
    loggedIn: boolean,
    authNonce: string,
} & SigningMessage;

export type SigningMessage = {
    accountAddress: string,
    sessionId: string,
    timestamp: number,
};

export type Signature = {
    accountAddress: string,
    signature: string,
    publicKey: string,
}

export type LoginRequest = {
    message: string,
} & Signature;

export type CreateResponse = {
    signingMessage: string,
    nonce: string,
}

export type UserResponse = {
    loggedIn: boolean
} & SigningMessage;

export type ErrorResponse = {
    message: string,
}

export const toError = (error: any): ErrorResponse => {
    if (!error?.message) {
        return {
            message: error?.message
        };
    } else {
        return {
            message: error.toString()
        };
    }
}

export type EndGameInput = {
    address: string,
    game_time: number,
}

export const isEndGameInput = (input: any): input is EndGameInput => {
    let maybeInput = (input as EndGameInput);

    return maybeInput.address !== undefined &&
        maybeInput.game_time !== undefined
}

export type MintInput = {
    destination_address: string,
} & ItemProperties

export const isMintInput = (input: any): input is MintInput => {
    let maybeInput = (input as MintInput);

    return maybeInput.destination_address !== undefined &&
        maybeInput.token_name !== undefined &&
        maybeInput.token_description !== undefined &&
        maybeInput.token_uri !== undefined &&
        maybeInput.health !== undefined &&
        maybeInput.speed !== undefined
}

export type SwapOrAddInput = {
    owner: string,
    fighter: string,
    wing?: string,
    body?: string,
}

export const isSwapOrAddInput = (input: any): input is SwapOrAddInput => {
    let maybeInput = (input as SwapOrAddInput);

    return maybeInput.owner !== undefined &&
        maybeInput.fighter !== undefined && (
            maybeInput.wing === undefined || typeof maybeInput.wing === "string"
        ) && (
            maybeInput.body === undefined || typeof maybeInput.body === "string"
        )
}

export type ItemProperties = {
    token_name: string,
    token_description: string,
    token_uri: string,
    health: number,
    speed: number
}

export type InventoryResponse = {
    owner: string,
    fighters: Fighter[],
    wings: Wing[],
    bodies: Body[],
}

export type Fighter = {
    wing?: Wing,
    body?: Body,
} & ItemProperties
export type Body = {} & ItemProperties
export type Wing = {} & ItemProperties

export type PilotInfo = {
    owner: string,
    timesPlayed: number,
    longestSurvival: number,
};

export type Balance = {
    balance: number,
}