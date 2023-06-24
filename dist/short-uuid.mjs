const version = "4.4.4";
/**
 * Constants
 */
const DEFAULT_UUID_LENGTH = 6;
const BOUNDARIES = {
    'digits': [48, 58],
    'alpha_lower': [97, 123],
    'hex': [97, 103],
    'alpha_upper': [65, 91]
};
const DICTIONNARIES = {
    'number': getDictionnary([BOUNDARIES['digits']]),
    'alpha': getDictionnary([BOUNDARIES['alpha_lower'], BOUNDARIES['alpha_upper']]),
    'alpha_lower': getDictionnary([BOUNDARIES['alpha_lower']]),
    'alpha_upper': getDictionnary([BOUNDARIES['alpha_upper']]),
    'alphanum': getDictionnary([BOUNDARIES['digits'], BOUNDARIES['alpha_lower'], BOUNDARIES['alpha_upper']]),
    'alphanum_lower': getDictionnary([BOUNDARIES['digits'], BOUNDARIES['alpha_lower']]),
    'alphanum_upper': getDictionnary([BOUNDARIES['digits'], BOUNDARIES['alpha_upper']]),
    'hex': getDictionnary([BOUNDARIES['digits'], BOUNDARIES['hex']])
};
const DEFAULT_PROBABILITY = 0.5;
const DEFAULT_OPTIONS = {
    dictionary: 'alphanum',
    shuffle: true,
    debug: false,
    length: DEFAULT_UUID_LENGTH,
};
/**
 *
 * Utils
 *
 */
function getRange(from, to) {
    return [...Array(to - from).keys()].map(i => i + from);
}
function getDictionnary(definitions) {
    const dict = [];
    for (const [lower, upper] of definitions) {
        getRange(lower, upper).map((bound) => {
            dict.push(String.fromCharCode(bound));
        });
    }
    return dict;
}
const ShortUUID = (_options) => {
    const options = Object.assign(Object.assign({}, DEFAULT_OPTIONS), _options);
    const state = {
        version: version,
        dict: [],
        counter: 0
    };
    const setDictionary = (dictionary, shuffle) => {
        let dict;
        if (dictionary && Array.isArray(dictionary)) {
            if (dictionary.length < 1)
                throw Error('Please provide an array with some elements');
            dict = dictionary;
        }
        else {
            dict = [...DICTIONNARIES[dictionary]];
        }
        if (shuffle) {
            // Shuffle Dictionary to remove selection bias.
            dict = dict.sort(() => Math.random() - DEFAULT_PROBABILITY);
        }
        state.dict = dict;
        state.counter = 0;
    };
    /**
     * Generates UUID based on internal counter that's incremented after each ID generation.
     * @alias `const uid = new ShortUniqueId(); uid.seq();`
     */
    const sequentialUUID = () => {
        let counterDiv;
        let counterRem;
        let id = '';
        counterDiv = state.counter;
        do {
            counterRem = counterDiv % state.dict.length;
            counterDiv = Math.trunc(counterDiv / state.dict.length);
            id += state.dict[counterRem];
        } while (counterDiv !== 0);
        state.counter += 1;
        return id;
    };
    /**
     * Generates UUID by creating each part randomly.
     * @alias `const uid = new ShortUniqueId(); uid(uuidLength: number);`
     */
    const randomUUID = (uuidLength = options.length || DEFAULT_UUID_LENGTH) => {
        if ((uuidLength === null || typeof uuidLength === 'undefined') || uuidLength < 1) {
            throw new Error('Invalid UUID Length Provided');
        }
        // Generate random ID parts from Dictionary.
        return getRange(0, uuidLength).map(() => {
            const randomPartIdx = parseInt((Math.random() * state.dict.length).toFixed(0), 10) % state.dict.length;
            return state.dict[randomPartIdx];
        }).join('');
    };
    /**
     * Calculates total number of possible UUIDs.
     *
     * Given that:
     *
     * - `H` is the total number of possible UUIDs
     * - `n` is the number of unique characters in the dictionary
     * - `l` is the UUID length
     *
     * Then `H` is defined as `n` to the power of `l`:
     *
     * ![](https://render.githubusercontent.com/render/math?math=%5CHuge%20H=n%5El)
     *
     * This function returns `H`.
     */
    const availableUUIDs = (uuidLength = options.length) => {
        return parseFloat(Math.pow([...new Set(state.dict)].length, uuidLength).toFixed(0));
    };
    /**
     * Calculates approximate number of hashes before first collision.
     *
     * Given that:
     *
     * - `H` is the total number of possible UUIDs, or in terms of this library,
     * the result of running `availableUUIDs()`
     * - the expected number of values we have to choose before finding the
     * first collision can be expressed as the quantity `Q(H)`
     *
     * Then `Q(H)` can be approximated as the square root of the product of half
     * of pi times `H`:
     *
     * ![](https://render.githubusercontent.com/render/math?math=%5CHuge%20Q(H)%5Capprox%5Csqrt%7B%5Cfrac%7B%5Cpi%7D%7B2%7DH%7D)
     *
     * This function returns `Q(H)`.
     *
     * (see [Poisson distribution](https://en.wikipedia.org/wiki/Poisson_distribution))
     */
    const approxMaxBeforeCollision = (rounds = availableUUIDs(options.length)) => {
        return parseFloat(Math.sqrt((Math.PI / 2) * rounds).toFixed(20));
    };
    /**
     * Calculates probability of generating duplicate UUIDs (a collision) in a
     * given number of UUID generation rounds.
     *
     * Given that:
     *
     * - `r` is the maximum number of times that `randomUUID()` will be called,
     * or better said the number of _rounds_
     * - `H` is the total number of possible UUIDs, or in terms of this library,
     * the result of running `availableUUIDs()`
     *
     * Then the probability of collision `p(r; H)` can be approximated as the result
     * of dividing the square root of the product of half of pi times `r` by `H`:
     *
     * ![](https://render.githubusercontent.com/render/math?math=%5CHuge%20p(r%3B%20H)%5Capprox%5Cfrac%7B%5Csqrt%7B%5Cfrac%7B%5Cpi%7D%7B2%7Dr%7D%7D%7BH%7D)
     *
     * This function returns `p(r; H)`.
     *
     * (see [Poisson distribution](https://en.wikipedia.org/wiki/Poisson_distribution))
     *
     * (Useful if you are wondering _"If I use this lib and expect to perform at most
     * `r` rounds of UUID generations, what is the probability that I will hit a duplicate UUID?"_.)
     */
    const collisionProbability = (rounds = availableUUIDs(options.length), uuidLength = options.length) => {
        const probability = approxMaxBeforeCollision(rounds) / availableUUIDs(uuidLength);
        return parseFloat((probability).toFixed(20));
    };
    /**
     * Calculate a "uniqueness" score (from 0 to 1) of UUIDs based on size of
     * dictionary and chosen UUID length.
     *
     * Given that:
     *
     * - `H` is the total number of possible UUIDs, or in terms of this library,
     * the result of running `availableUUIDs()`
     * - `Q(H)` is the approximate number of hashes before first collision,
     * or in terms of this library, the result of running `approxMaxBeforeCollision()`
     *
     * Then `uniqueness` can be expressed as the additive inverse of the probability of
     * generating a "word" I had previously generated (a duplicate) at any given iteration
     * up to the the total number of possible UUIDs expressed as the quotiend of `Q(H)` and `H`:
     *
     * ![](https://render.githubusercontent.com/render/math?math=%5CHuge%201-%5Cfrac%7BQ(H)%7D%7BH%7D)
     *
     * (Useful if you need a value to rate the "quality" of the combination of given dictionary
     * and UUID length. The closer to 1, higher the uniqueness and thus better the quality.)
     */
    const uniqueness = (rounds = availableUUIDs(options.length)) => {
        const collisionOnRounds = approxMaxBeforeCollision(rounds) / rounds;
        const score = parseFloat((1 - collisionOnRounds).toFixed(20));
        if (score > 1)
            return 1;
        if (score < 0)
            return 0;
        return score;
    };
    /**
     * Return the version of this module.
     */
    const getVersion = () => {
        return state.version;
    };
    /**
     * Generates a UUID with a timestamp that can be extracted using `uid.parseStamp(stampString);`.
     *
     * ```js
     *  const uidWithTimestamp = uid.stamp(32);
     *  console.log(uidWithTimestamp);
     *  // GDa608f973aRCHLXQYPTbKDbjDeVsSb3
     *
     *  console.log(uid.parseStamp(uidWithTimestamp));
     *  // 2021-05-03T06:24:58.000Z
     *  ```
     */
    const stamp = (finalLength) => {
        if (typeof finalLength !== 'number' || finalLength < 10) {
            throw new Error('Param finalLength must be number greater than 10');
        }
        const hexStamp = Math.floor(+new Date() / 1000).toString(16);
        const idLength = finalLength - 9;
        const rndIdx = Math.round(Math.random() * ((idLength > 15) ? 15 : idLength));
        const id = randomUUID(idLength);
        return `${id.substr(0, rndIdx)}${hexStamp}${id.substr(rndIdx)}${rndIdx.toString(16)}`;
    };
    /**
     * Extracts the date embeded in a UUID generated using the `uid.stamp(finalLength);` method.
     *
     * ```js
     *  const uidWithTimestamp = uid.stamp(32);
     *  console.log(uidWithTimestamp);
     *  // GDa608f973aRCHLXQYPTbKDbjDeVsSb3
     *
     *  console.log(uid.parseStamp(uidWithTimestamp));
     *  // 2021-05-03T06:24:58.000Z
     *  ```
     */
    const parseStamp = (stamp) => {
        if (stamp.length < 10) {
            throw new Error('Stamp length invalid');
        }
        const rndIdx = parseInt(stamp.substr(stamp.length - 1, 1), 16);
        return new Date(parseInt(stamp.substr(rndIdx, 8), 16) * 1000);
    };
    // Initialise
    setDictionary(options.dictionary, options.shuffle);
    return {
        setDictionary,
        sequentialUUID,
        randomUUID,
        availableUUIDs,
        approxMaxBeforeCollision,
        collisionProbability,
        uniqueness,
        getVersion,
        stamp,
        parseStamp
    };
};

export { ShortUUID };
//# sourceMappingURL=short-uuid.mjs.map
