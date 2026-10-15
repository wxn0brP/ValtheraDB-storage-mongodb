import { MongoDbAction } from "./actions.js";
export * from "./actions.js";
export const DYNAMIC = {
    def(mongoUri, dbName, clientOpts) {
        return new MongoDbAction(mongoUri, dbName, clientOpts);
    },
    mongodb(mongoUri, dbName, clientOpts) {
        return new MongoDbAction(mongoUri, dbName, clientOpts);
    },
};
