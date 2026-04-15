import { VdbMongo } from "./class";
export * from "./class";

export const DYNAMIC = {
    mongodb(mongoUri: string, dbName: string) {
        return new VdbMongo(mongoUri, dbName);
    }
}
