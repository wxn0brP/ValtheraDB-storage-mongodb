import { MongoDbAction } from "./actions.js";
export * from "./class.js";
export const DYNAMIC = {
    mongodb(mongoUri, dbName) {
        return new MongoDbAction(mongoUri, dbName);
    }
};
