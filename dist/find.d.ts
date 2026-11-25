import { VQueryT } from "@wxn0brp/db-core/types/query";
import { MongoDbAdapter } from "./adapter.js";
export declare function find(mongo: MongoDbAdapter, query: VQueryT.Find): Promise<import("@wxn0brp/db-core/types/data").Data[]>;
export declare function findOne(mongo: MongoDbAdapter, query: VQueryT.FindOne): Promise<import("mongodb").WithId<import("bson").Document>>;
