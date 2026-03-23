import { ActionsBase } from "@wxn0brp/db-core/base/actions";
import { DataInternal } from "@wxn0brp/db-core/types/data";
import * as Query from "@wxn0brp/db-core/types/query";
import { Collection, Db, MongoClient } from "mongodb";
export declare class MongoDbAction extends ActionsBase {
    logs: boolean;
    _client: MongoClient;
    _db: Db;
    constructor(mongoUri: string, dbName: string, logs?: boolean);
    init(): Promise<void>;
    close(): Promise<void>;
    _getCollection(name: string): Collection;
    add<T>(query: Query.AddQuery): Promise<T>;
    find<T>(query: Query.FindQuery): Promise<T[]>;
    findOne<T>(query: Query.FindOneQuery): Promise<T | null>;
    update(query: Query.UpdateQuery): Promise<DataInternal[]>;
    updateOne(query: Query.UpdateQuery): Promise<DataInternal | null>;
    remove(query: Query.RemoveQuery): Promise<DataInternal[]>;
    removeOne(query: Query.RemoveQuery): Promise<DataInternal | null>;
    getCollections(): Promise<string[]>;
    ensureCollection(collection: string): Promise<boolean>;
    issetCollection(collection: string): Promise<boolean>;
    removeCollection(collection: string): Promise<boolean>;
}
