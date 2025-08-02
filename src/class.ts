import { ValtheraClass } from "@wxn0brp/db-core";
import { MongoDbAction } from "./actions";

export class VdbMongo extends ValtheraClass {
    constructor(mongoUri: string, dbName: string, logs: boolean = false) {
        const mongoDbAction = new MongoDbAction(mongoUri, dbName, logs);
        super({ dbAction: mongoDbAction });
    }

    async close(): Promise<void> {
        await (this.dbAction as MongoDbAction).close();
    }
}