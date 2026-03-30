import { useQuery } from "@tanstack/react-query";
import { suiClient } from "./suiClient";
import { blake2b } from "@noble/hashes/blake2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

export type InventoryItem = {
    typeId: string;
    quantity: number;
    volume: number;
};

export type SsuInventory = {
    main: InventoryItem[];
    open: InventoryItem[];
    owned: InventoryItem[];
};

function computeOpenStorageKey(ssuId: string): string {
    const idBytes = hexToBytes(ssuId.replace("0x", ""));
    const suffix = new TextEncoder().encode("open_inventory");
    const data = new Uint8Array(idBytes.length + suffix.length);
    data.set(idBytes);
    data.set(suffix, idBytes.length);
    return "0x" + bytesToHex(blake2b(data, { dkLen: 32 }));
}

function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
}

export function useSsuInventory(ssuId: string | null) {
    return useQuery({
        queryKey: ["ssu-inventory", ssuId],
        queryFn: async (): Promise<SsuInventory | null> => {
            try {
                const ssu = await suiClient.getObject({
                    id: ssuId!,
                    options: { showContent: true },
                });
                const fields = (ssu.data?.content as any)?.fields;
                if (!fields) return null;

                const ownerCapId: string = fields.owner_cap_id;
                const openKey = computeOpenStorageKey(ssuId!);

                // Paginate all dynamic fields (SSU can have 2 + N player inventories)
                let cursor: string | null | undefined = undefined;
                let allDfData: any[] = [];
                let dfList: any;
                do {
                    dfList = await suiClient.getDynamicFields({ parentId: ssuId!, limit: 50, cursor: cursor as any });
                    allDfData = allDfData.concat(dfList.data);
                    cursor = dfList.hasNextPage ? dfList.nextCursor : null;
                } while (cursor);

                const main: InventoryItem[] = [];
                const open: InventoryItem[] = [];
                const owned: InventoryItem[] = [];

                const idFields = allDfData.filter((df: any) => df.name?.type === "0x2::object::ID");
                const dfObjects = await Promise.all(
                    idFields.map((df: any) => suiClient.getDynamicFieldObject({ parentId: ssuId!, name: df.name })
                        .then(obj => ({ keyId: df.name.value as string, obj })))
                );

                for (const { keyId, obj } of dfObjects) {
                    const value = (obj.data?.content as any)?.fields?.value?.fields;
                    if (!value?.items) continue;

                    const items = parseItems(value.items);
                    if (keyId === ownerCapId) {
                        main.push(...items);
                    } else if (keyId === openKey) {
                        open.push(...items);
                    } else {
                        owned.push(...items);
                    }
                }

                return { main, open, owned };
            } catch (e) {
                console.error("Inventory fetch error:", e);
                return null;
            }
        },
        enabled: !!ssuId,
        refetchInterval: 5_000,
        staleTime: 0,
    });
}

function parseItems(itemsField: any): InventoryItem[] {
    const entries = itemsField?.fields?.contents || itemsField?.contents || itemsField;
    if (!Array.isArray(entries)) return [];

    return entries.map((entry: any) => {
        const f = entry?.fields || entry;
        const val = f?.value?.fields || f?.value || f;
        return {
            typeId: String(val?.type_id ?? f?.key ?? "?"),
            quantity: Number(val?.quantity ?? 0),
            volume: Number(val?.volume ?? 0),
        };
    });
}
