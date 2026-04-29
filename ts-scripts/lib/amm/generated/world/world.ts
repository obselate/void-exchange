/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { MoveStruct } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
const $moduleName = '@local-pkg/world::world';
export const GovernorCap = new MoveStruct({ name: `${$moduleName}::GovernorCap`, fields: {
        id: bcs.Address,
        governor: bcs.Address
    } });