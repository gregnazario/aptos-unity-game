export type SessionInfo = {
    accountAddress: string,
    sessionId: string,
    timestamp: number,
    loggedIn: boolean,
    authNonce: string,
};

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
    signature: string
    publicKey: string,
    accountAddress: string,
}

export type CreateResponse = {
    signingMessage: string,
    nonce: string,
}

export type UserResponse = {
    accountAddress: string,
    sessionId: string,
    loggedIn: boolean
    timestamp: number
}

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

export type MintInput = {
    destination_address: string,
    token_name: string,
    token_description: string,
    token_uri: string,
    health: number,
    speed: number
}

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
