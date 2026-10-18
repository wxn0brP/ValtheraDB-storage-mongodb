import { VQueryT } from "@wxn0brp/db-core/types/query";
import { MongoDbAction } from "./actions.js";
export declare function find(mongo: MongoDbAction, query: VQueryT.Find): Promise<import("@wxn0brp/db-core/types/data").Data[]>;
export declare function findOne(mongo: MongoDbAction, query: VQueryT.FindOne): Promise<import("mongodb").WithId<import("bson").Document>>;
