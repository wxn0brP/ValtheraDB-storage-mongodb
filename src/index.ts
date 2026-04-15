import { MongoDbAction } from "./actions";
export * from "./class";

export const DYNAMIC = {
    mongodb(mongoUri: string, dbName: string) {
        return new MongoDbAction(mongoUri, dbName);
    }
}
