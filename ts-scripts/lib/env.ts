/**
 * Environment variable loading.
 *
 * Scripts must declare what they read up front via `loadEnv` so a missing
 * variable fails fast with a single message listing every missing key, rather
 * than partway through execution.
 */

/**
 * Read a required env var. Throws with a clear message if unset or empty.
 */
export function requireEnv(name: string): string {
    const value = process.env[name];
    if (value === undefined || value === "") {
        throw new Error(`${name} is required but not set in the environment.`);
    }
    return value;
}

/**
 * Read an optional env var with a fallback. Returns the fallback if unset
 * or empty.
 */
export function optionalEnv(name: string, fallback: string): string {
    const value = process.env[name];
    return value === undefined || value === "" ? fallback : value;
}

/**
 * Validate a set of required env vars and return them as a typed record.
 * Reports every missing key in a single error rather than failing on the first.
 *
 * @example
 *   const env = loadEnv(["AMM_PACKAGE_ID", "SSU_OBJECT_ID"]);
 *   env.AMM_PACKAGE_ID; // string
 */
export function loadEnv<K extends readonly string[]>(keys: K): { [P in K[number]]: string } {
    const missing: string[] = [];
    const out: Record<string, string> = {};
    for (const key of keys) {
        const value = process.env[key];
        if (value === undefined || value === "") {
            missing.push(key);
        } else {
            out[key] = value;
        }
    }
    if (missing.length > 0) {
        throw new Error(
            `Missing required env vars: ${missing.join(", ")}. ` +
                `Set them in your shell or in a .env file.`
        );
    }
    return out as { [P in K[number]]: string };
}
