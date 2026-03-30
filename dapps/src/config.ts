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
    "77800": "Feldspar Crystals",
    "77810": "Platinum",
    "77811": "Hydrated Sulfide",
    "77818": "Unstable Fuel",
    "78423": "Water Ice",
    "78446": "Methane Ice",
    "81846": "Sojourn",
    "83463": "Synthetic Mining",
    "83818": "Fossilized Exotronics",
    "84182": "Reinforced Alloys",
    "84210": "Carbon Weave",
    "88234": "Troilite Sulfide",
    "88335": "D1 Fuel",
    "88561": "Thermal Composites",
    "88764": "Salvaged Material",
    "89258": "Hydrocarbon",
    "89259": "Silica Grains",
    "89260": "Iron-Rich Nodules",
    "91496": "Feral Trace",
    "99001": "Palladium",
};

export function itemName(typeId: string): string {
    return ITEM_NAMES[typeId] || `#${typeId}`;
}
