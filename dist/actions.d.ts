import { ActionsBase } from "@wxn0brp/db-core/base/actions";
import { DataInternal } from "@wxn0brp/db-core/types/data";
import { VQueryT } from "@wxn0brp/db-core/types/query";
import { Collection, Db, MongoClient } from "mongodb";
export declare class MongoDbAction extends ActionsBase {
    logs: boolean;
    _client: MongoClient;
    _db: Db;
    constructor(mongoUri: string, dbName: string, logs?: boolean);
    init(): Promise<void>;
    close(): Promise<void>;
    _getCollection(name: string): Collection;
    add(query: VQueryT.Add): Promise<import("@wxn0brp/db-core/types/arg").Arg<import("@wxn0brp/db-core/types/data").Data>>;
    find(query: VQueryT.Find): Promise<import("@wxn0brp/db-core/types/data").Data[]>;
    findOne(query: VQueryT.FindOne): Promise<import("mongodb").WithId<import("bson").Document>>;
    update(query: VQueryT.Update): Promise<import("mongodb").WithId<import("bson").Document>[]>;
    updateOne(query: VQueryT.Update): Promise<DataInternal>;
    remove(query: VQueryT.Remove): Promise<DataInternal[]>;
    removeOne(query: VQueryT.Remove): Promise<DataInternal>;
    getCollections(): Promise<string[]>;
    ensureCollection(collection: string): Promise<boolean>;
    issetCollection(collection: string): Promise<boolean>;
    removeCollection(collection: string): Promise<boolean>;
}
