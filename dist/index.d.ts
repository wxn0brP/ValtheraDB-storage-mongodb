import { MongoClientOptions } from "mongodb";
import { MongoDbAction } from "./actions.js";
export * from "./actions.js";
export declare const DYNAMIC: {
    mongodb(mongoUri: string, dbName: string, clientOpts?: MongoClientOptions): MongoDbAction;
};
