import { MongoClientOptions } from "mongodb";
import { MongoDbAction } from "./actions.js";
export * from "./actions.js";
export declare const DYNAMIC: {
    def(mongoUri: string, dbName: string, clientOpts?: MongoClientOptions): MongoDbAction;
    mongodb(mongoUri: string, dbName: string, clientOpts?: MongoClientOptions): MongoDbAction;
};
