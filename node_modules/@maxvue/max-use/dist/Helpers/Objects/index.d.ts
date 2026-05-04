import { deepClone } from './deepClone';
import { get } from './get';
import { unset } from './unset';
import { isEqual } from './isEqual';
import { deepMerge } from './deepMerge';
import { renameKeys } from './renameKeys';
import { pick, omit } from './manipulations';
import { mapValues } from './mapValues';
import { set } from './set';
import { diff } from './diff';
export { deepClone, get, set, unset, isEqual, deepMerge, renameKeys, pick, omit, mapValues, diff };
export { deepClone as cloneDeep };
export declare const Obj: {
    deepClone: typeof deepClone;
    cloneDeep: typeof deepClone;
    get: typeof get;
    set: typeof set;
    unset: typeof unset;
    isEqual: typeof isEqual;
    deepMerge: typeof deepMerge;
    renameKeys: typeof renameKeys;
    pick: typeof pick;
    omit: typeof omit;
    mapValues: typeof mapValues;
    diff: typeof diff;
};
//# sourceMappingURL=index.d.ts.map