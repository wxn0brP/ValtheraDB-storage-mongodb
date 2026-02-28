import { genId } from "@wxn0brp/db-core";
import { ActionsBase } from "@wxn0brp/db-core/base/actions";
import { DataInternal } from "@wxn0brp/db-core/types/data";
import { FileCpu } from "@wxn0brp/db-core/types/fileCpu";
import { VQuery } from "@wxn0brp/db-core/types/query";
import { findUtil } from "@wxn0brp/db-core/utils/action";
import { Collection, Db, MongoClient } from "mongodb";
import { cleanDocs, translateQuery } from "./utils";

export class MongoDbAction extends ActionsBase {
    _client: MongoClient;
    _db: Db;

    constructor(mongoUri: string, dbName: string, public logs: boolean = false) {
        super();
        this._client = new MongoClient(mongoUri);
        this._db = this._client.db(dbName);
    }

    async init() {
        await this._client.connect();
        if (this.logs) console.log(`Connected to MongoDB (${this._db.databaseName})`);
    }

    async close() {
        await this._client.close();
        if (this.logs) console.log(`Disconnected from MongoDB (${this._db.databaseName})`);
    }

    _getCollection(name: string): Collection {
        return this._db.collection(name);
    }

    async add<T>(query: VQuery): Promise<T> {
        const { collection, data, id_gen = true } = query;
        const coll = this._getCollection(collection);

        if (id_gen === false && !data._id) {
            const dataToInsert = { ...data, _vdb_no_id: true };
            await coll.insertOne(dataToInsert);
            return data as T;
        }

        if (id_gen && !data._id) {
            data._id = genId();
        }

        await coll.insertOne(data);
        return data as T;
    }

    async find<T>(query: VQuery): Promise<T[]> {
        const { collection, search } = query;
        const coll = this._getCollection(collection);
        const mongoQuery = translateQuery(search);
        const results = await coll.find(mongoQuery).toArray();
        const cleanResults = cleanDocs(results) as T[];
        const mockFileCpu = {
            async find(file, search, context, findOpts) {
                return cleanResults as DataInternal[];
            },
        } as FileCpu;
        return await findUtil(query, mockFileCpu, [""]) as T[];
    }

    async findOne<T>(query: VQuery): Promise<T | null> {
        const { collection, search } = query;
        const coll = this._getCollection(collection);
        const mongoQuery = translateQuery(search);
        const result = await coll.findOne(mongoQuery);
        return cleanDocs(result) as T | null;
    }

    async update(query: VQuery): Promise<DataInternal[]> {
        const { collection, search, updater } = query;
        const coll = this._getCollection(collection);
        const mongoQuery = translateQuery(search);
        await coll.updateMany(mongoQuery, { $set: updater });
        const result = await coll.find(mongoQuery).toArray();
        return cleanDocs(result) as DataInternal[];
    }

    async updateOne(query: VQuery): Promise<DataInternal | null> {
        const { collection, search, updater } = query;
        const coll = this._getCollection(collection);
        const mongoQuery = translateQuery(search);
        await coll.updateOne(mongoQuery, { $set: updater });
        const result = await coll.findOne(mongoQuery);
        return cleanDocs(result) as DataInternal | null;
    }

    async remove(query: VQuery): Promise<DataInternal[]> {
        const { collection, search } = query;
        const coll = this._getCollection(collection);
        const mongoQuery = translateQuery(search);
        const result = await coll.find(mongoQuery).toArray();
        await coll.deleteMany(mongoQuery);
        return cleanDocs(result) as DataInternal[];
    }

    async removeOne(query: VQuery): Promise<DataInternal | null> {
        const { collection, search } = query;
        const coll = this._getCollection(collection);
        const mongoQuery = translateQuery(search);

        const result = await coll.findOne(mongoQuery);
        await coll.deleteOne(mongoQuery);
        return cleanDocs(result) as DataInternal | null;
    }

    async getCollections(): Promise<string[]> {
        const collections = await this._db.listCollections().toArray();
        return collections.map(c => c.name);
    }

    async ensureCollection(query: VQuery): Promise<boolean> {
        try {
            await this._db.createCollection(query.collection);
            return true;
        } catch (error: any) {
            if (error.codeName === 'NamespaceExists') { return true; }
            throw error;
        }
    }

    async issetCollection(query: VQuery): Promise<boolean> {
        const collections = await this.getCollections();
        return collections.includes(query.collection);
    }

    async removeCollection(query: VQuery): Promise<boolean> {
        const { collection } = query;
        try {
            await this._db.dropCollection(collection);
            return true;
        } catch (error: any) {
            if (error.codeName === 'NamespaceNotFound') { return true; }
            throw error;
        }
    }
}
