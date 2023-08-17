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

export type Error = {
    message: string,
}

export const toError = (error: any): Error => {
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