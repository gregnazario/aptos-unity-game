export const FIGHTERS: AssetInfo[] = [
    {
        token_name: "Standard fighter",
        token_description: "Standard fighter type",
        token_uri: "",
        health: 1,
        speed: 1,
    }
];
export const BODIES: AssetInfo[] = [
    {
        token_name: "Speed Body",
        token_description: "Speedy body made for speed",
        token_uri: "",
        health: 1,
        speed: 5,
    }
];
export const WINGS: AssetInfo[] = [
    {
        token_name: "Red Wing",
        token_description: "A red wing",
        token_uri: "",
        health: 1,
        speed: 2,
    },
    {
        token_name: "Speed Wing",
        token_description: "A speed wing",
        token_uri: "",
        health: 1,
        speed: 2,
    }
];

export type AssetInfo = {
    token_name: string,
    token_description: string,
    token_uri: string,
    health: number,
    speed: number,
}