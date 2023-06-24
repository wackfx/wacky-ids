/**
 * Types
 */
export interface Options {
    /** User-defined character dictionary */
    dictionary: string[] | keyof typeof DICTIONNARIES;
    /** If true, sequentialUUID use the dictionary in the given order */
    shuffle: boolean;
    /** If true the instance will console.log useful info */
    debug: boolean;
    /** From 1 to infinity, the length you wish your UUID to be */
    length: number;
}
declare const DICTIONNARIES: {
    number: string[];
    alpha: string[];
    alpha_lower: string[];
    alpha_upper: string[];
    alphanum: string[];
    alphanum_lower: string[];
    alphanum_upper: string[];
    hex: string[];
};
export declare const ShortUUID: (_options?: Partial<Options>) => {
    setDictionary: (dictionary: string[] | keyof typeof DICTIONNARIES, shuffle?: boolean) => void;
    sequentialUUID: () => string;
    randomUUID: (uuidLength?: number) => string;
    availableUUIDs: (uuidLength?: number) => number;
    approxMaxBeforeCollision: (rounds?: number) => number;
    collisionProbability: (rounds?: number, uuidLength?: number) => number;
    uniqueness: (rounds?: number) => number;
    getVersion: () => string;
    stamp: (finalLength: number) => string;
    parseStamp: (stamp: string) => Date;
};
export {};
