import { ActionsBase } from "@wxn0brp/db-core/base/actions";
import { DataInternal } from "@wxn0brp/db-core/types/data";
import { VQueryT } from "@wxn0brp/db-core/types/query";
import { Collection, Db, MongoClient, MongoClientOptions } from "mongodb";
export declare class MongoDbAction extends ActionsBase {
    _client: MongoClient;
    _db: Db;
    constructor(mongoUri: string, dbName: string, clientOpts?: MongoClientOptions);
    init(): Promise<void>;
    close(): Promise<void>;
    _getCollection(name: string): Collection;
    _applyFindOpts<T extends DataInternal | DataInternal[] | null | undefined>(data: T, findOpts: VQueryT.Find["findOpts"]): T;
    add(query: VQueryT.Add): Promise<import("@wxn0brp/db-core/types/arg").Arg<import("@wxn0brp/db-core/types/data").Data>>;
    find(query: VQueryT.Find): Promise<import("bson").Document[]>;
    findOne(query: VQueryT.FindOne): Promise<import("mongodb").WithId<import("bson").Document>>;
    update(query: VQueryT.Update): Promise<any>;
    updateOne(query: VQueryT.Update): Promise<any>;
    remove(query: VQueryT.Remove): Promise<any>;
    removeOne(query: VQueryT.Remove): Promise<any>;
    getCollections(): Promise<string[]>;
    ensureCollection(collection: string): Promise<boolean>;
    issetCollection(collection: string): Promise<boolean>;
    removeCollection(collection: string): Promise<boolean>;
}
