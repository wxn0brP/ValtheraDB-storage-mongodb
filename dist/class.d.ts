import { ValtheraClass } from "@wxn0brp/db-core";
export declare class VdbMongo extends ValtheraClass {
    constructor(mongoUri: string, dbName: string, logs?: boolean);
    close(): Promise<void>;
}
