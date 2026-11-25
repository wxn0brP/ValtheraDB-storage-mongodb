import { MongoClientOptions } from "mongodb";
import { MongoDbAdapter } from "./adapter.js";
export * from "./adapter.js";
export declare const DYNAMIC: {
    def(mongoUri: string, dbName: string, clientOpts?: MongoClientOptions): MongoDbAdapter;
};
