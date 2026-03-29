export const WORLD_PACKAGE_ID = import.meta.env.VITE_EVE_WORLD_PACKAGE_ID as string;

/** Original package ID — used for type references (never changes across upgrades). */
export const AMM_ORIGINAL_PACKAGE_ID = import.meta.env.VITE_AMM_ORIGINAL_PACKAGE_ID as string;

/** Current package ID — used for function calls (changes with each upgrade). */
const AMM_CURRENT_PACKAGE_ID = import.meta.env.VITE_AMM_PACKAGE_ID as string;

/** Current package ID for function calls. Falls back to original if not overridden. */
export function getAmmPackageId(): string {
    return localStorage.getItem("amm_package_id") || AMM_CURRENT_PACKAGE_ID;
}

export function setAmmPackageId(id: string) {
    localStorage.setItem("amm_package_id", id);
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
};
