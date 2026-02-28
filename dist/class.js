import { ValtheraClass } from "@wxn0brp/db-core";
import { MongoDbAction } from "./actions.js";
export class VdbMongo extends ValtheraClass {
    constructor(mongoUri, dbName, logs = false) {
        const mongoDbAction = new MongoDbAction(mongoUri, dbName, logs);
        super({ dbAction: mongoDbAction });
    }
    async close() {
        await this.dbAction.close();
    }
}
