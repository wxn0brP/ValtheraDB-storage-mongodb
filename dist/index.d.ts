import { MongoDbAction } from "./actions.js";
export * from "./class.js";
export declare const DYNAMIC: {
    mongodb(mongoUri: string, dbName: string): MongoDbAction;
};
