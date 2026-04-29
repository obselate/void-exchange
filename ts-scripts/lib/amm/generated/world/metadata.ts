/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/** Metadata for any assembly is managed here */

import { MoveStruct } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import * as in_game_id from './in_game_id.js';
const $moduleName = '@local-pkg/world::metadata';
export const Metadata = new MoveStruct({ name: `${$moduleName}::Metadata`, fields: {
        assembly_id: bcs.Address,
        name: bcs.string(),
        description: bcs.string(),
        url: bcs.string()
    } });
export const MetadataChangedEvent = new MoveStruct({ name: `${$moduleName}::MetadataChangedEvent`, fields: {
        assembly_id: bcs.Address,
        assembly_key: in_game_id.TenantItemId,
        name: bcs.string(),
        description: bcs.string(),
        url: bcs.string()
    } });