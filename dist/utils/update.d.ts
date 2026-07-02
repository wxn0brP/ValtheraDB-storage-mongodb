import { Collection } from "mongodb";
export declare function translateUpdater(updater: any): Record<string, any>;
export declare function isEmptyUpdate(mu: any): boolean;
export declare function resolveSearch(search: any, coll: Collection, context?: any): Promise<{
    filter: any;
    allData: import("mongodb").WithId<import("bson").Document>[];
} | {
    filter: any;
    allData: any;
}>;
