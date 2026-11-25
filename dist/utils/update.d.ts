import { Collection } from "mongodb";
export declare function needsJsUpdater(updater: any): boolean;
export declare function applyJsUpdater(doc: Record<string, any>, updater: any): Record<string, any>;
export declare function translateUpdater(updater: any): Record<string, any>;
export declare function needsNumericCheck(updater: any): boolean;
export declare function assertNumericOps(docs: any[], updater: any): void;
export declare function isEmptyUpdate(mu: any): boolean;
export declare function resolveSearch(search: any, coll: Collection, opts?: any): Promise<{
    filter: any;
    allData: import("mongodb").WithId<import("bson").Document>[];
} | {
    filter: any;
    allData: any;
}>;
