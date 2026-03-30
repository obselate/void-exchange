export const WORLD_PACKAGE_ID = import.meta.env.VITE_EVE_WORLD_PACKAGE_ID as string;

/** Original package ID from .env — used as fallback for type references. */
const AMM_ORIGINAL_PACKAGE_ID_ENV = import.meta.env.VITE_AMM_ORIGINAL_PACKAGE_ID as string;

/** Current package ID from .env — used as fallback for function calls. */
const AMM_CURRENT_PACKAGE_ID_ENV = import.meta.env.VITE_AMM_PACKAGE_ID as string;

/** .env package IDs — always point to the latest deployment.
 *  Used by rescue_items which only exists in the latest contract. */
export const AMM_ENV_ORIGINAL_PACKAGE_ID = AMM_ORIGINAL_PACKAGE_ID_ENV;
export const AMM_ENV_CURRENT_PACKAGE_ID = AMM_CURRENT_PACKAGE_ID_ENV;

/** Original package ID (type references). Pool-derived value takes priority over .env. */
export function getAmmOriginalPackageId(): string {
    return localStorage.getItem("amm_original_package_id") || AMM_ORIGINAL_PACKAGE_ID_ENV;
}

/** Current package ID for function calls. Pool-derived value takes priority over .env. */
export function getAmmPackageId(): string {
    return localStorage.getItem("amm_package_id") || AMM_CURRENT_PACKAGE_ID_ENV;
}

export function setAmmPackageId(id: string) {
    localStorage.setItem("amm_package_id", id);
}

export function setAmmOriginalPackageId(id: string) {
    localStorage.setItem("amm_original_package_id", id);
}

export const MODULES = {
    CHARACTER: "character",
    STORAGE_UNIT: "storage_unit",
    AMM: "amm",
} as const;

/** Short item names by type_id. Expand as new items appear in EVE Frontier. */
export const ITEM_NAMES: Record<string, string> = {
    "4": "Fuel",
    "77800": "Feldspar",
    "77810": "Platinum",
    "77811": "Hydrated Sulfied Matrix",
    "88335": "D1 Fuel",
};

export function itemName(typeId: string): string {
    return ITEM_NAMES[typeId] || `#${typeId}`;
}
