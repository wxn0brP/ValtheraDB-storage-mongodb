import { Collection } from "mongodb";
export declare function nativeAggregate(coll: Collection, mongoQuery: any, dbFindOpts: any): Promise<import("bson").Document[]>;
