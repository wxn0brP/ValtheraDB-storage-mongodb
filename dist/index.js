import { MongoDbAdapter } from "./adapter.js";
export * from "./adapter.js";
export const DYNAMIC = {
    def(mongoUri, dbName, clientOpts) {
        return new MongoDbAdapter(mongoUri, dbName, clientOpts);
    },
};
