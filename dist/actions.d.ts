import { ActionsBase } from "@wxn0brp/db-core/base/actions";
import { DataInternal } from "@wxn0brp/db-core/types/data";
import { VQuery } from "@wxn0brp/db-core/types/query";
import { Collection, Db, MongoClient } from "mongodb";
export declare class MongoDbAction extends ActionsBase {
    logs: boolean;
    _client: MongoClient;
    _db: Db;
    constructor(mongoUri: string, dbName: string, logs?: boolean);
    init(): Promise<void>;
    close(): Promise<void>;
    _getCollection(name: string): Collection;
    add<T>(query: VQuery): Promise<T>;
    find<T>(query: VQuery): Promise<T[]>;
    findOne<T>(query: VQuery): Promise<T | null>;
    update(query: VQuery): Promise<DataInternal[]>;
    updateOne(query: VQuery): Promise<DataInternal | null>;
    remove(query: VQuery): Promise<DataInternal[]>;
    removeOne(query: VQuery): Promise<DataInternal | null>;
    getCollections(): Promise<string[]>;
    ensureCollection(query: VQuery): Promise<boolean>;
    issetCollection(query: VQuery): Promise<boolean>;
    removeCollection(query: VQuery): Promise<boolean>;
}
