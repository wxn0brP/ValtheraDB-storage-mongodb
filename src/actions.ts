import ActionsBase from "@wxn0brp/db-core/base/actions";
import gen from "@wxn0brp/db-core/helpers/gen";
import { VQuery } from "@wxn0brp/db-core/types/query";
import { MongoClient, Db, Collection } from "mongodb";
import { translateQuery, cleanDocs } from "./utils";

export class MongoDbAction extends ActionsBase {
    private client: MongoClient;
    private db: Db;

    constructor(mongoUri: string, dbName: string, public logs: boolean = false) {
        super();
        this.client = new MongoClient(mongoUri);
        this.db = this.client.db(dbName);
    }

    async init() {
        await this.client.connect();
        if(this.logs) console.log(`Connected to MongoDB (${this.db.databaseName})`);
    }

    async close() {
        await this.client.close();
        if(this.logs) console.log(`Disconnected from MongoDB (${this.db.databaseName})`);
    }

    private getCollection(name: string): Collection { return this.db.collection(name); }

    async add<T>(config: VQuery & { id_gen?: boolean }): Promise<T> {
        const { collection, data, id_gen = true } = config;
        const coll = this.getCollection(collection);
        
        if (id_gen === false && !(data as any)._id) {
            const dataToInsert = { ...data, _vdb_no_id: true };
            await coll.insertOne(dataToInsert);
            return data as T;
        }

        if (id_gen && !(data as any)._id) {
            (data as any)._id = gen();
        }
        await coll.insertOne(data as any);
        return data as T;
    }

    async find<T>({ collection, search }: VQuery): Promise<T[]> {
        const coll = this.getCollection(collection);
        const mongoQuery = translateQuery(search);
        const results = await coll.find(mongoQuery).toArray();
        return cleanDocs(results) as T[];
    }

    async findOne<T>({ collection, search }: VQuery): Promise<T | null> {
        const coll = this.getCollection(collection);
        const mongoQuery = translateQuery(search);
        const result = await coll.findOne(mongoQuery);
        return cleanDocs(result) as T | null;
    }

    async update({ collection, search, updater }: VQuery): Promise<boolean> {
        const coll = this.getCollection(collection);
        const mongoQuery = translateQuery(search);
        const result = await coll.updateMany(mongoQuery, { $set: updater });
        return result.modifiedCount > 0;
    }

    async updateOne({ collection, search, updater }: VQuery): Promise<boolean> {
        const coll = this.getCollection(collection);
        const mongoQuery = translateQuery(search);
        const result = await coll.updateOne(mongoQuery, { $set: updater });
        return result.modifiedCount > 0;
    }

    async remove({ collection, search }: VQuery): Promise<boolean> {
        const coll = this.getCollection(collection);
        const mongoQuery = translateQuery(search);
        const result = await coll.deleteMany(mongoQuery);
        return result.deletedCount > 0;
    }

    async removeOne({ collection, search }: VQuery): Promise<boolean> {
        const coll = this.getCollection(collection);
        const mongoQuery = translateQuery(search);
        const result = await coll.deleteOne(mongoQuery);
        return result.deletedCount > 0;
    }

    async getCollections(): Promise<string[]> {
        const collections = await this.db.listCollections().toArray();
        return collections.map(c => c.name);
    }

    async ensureCollection({ collection }: VQuery): Promise<boolean> {
        try {
            await this.db.createCollection(collection);
            return true;
        } catch (error: any) {
            if (error.codeName === 'NamespaceExists') { return true; }
            throw error;
        }
    }

    async issetCollection({ collection }: VQuery): Promise<boolean> {
        const collections = await this.getCollections();
        return collections.includes(collection);
    }

    async removeCollection({ collection }: VQuery): Promise<boolean> {
        try {
            await this.db.dropCollection(collection);
            return true;
        } catch (error: any) {
            if (error.codeName === 'NamespaceNotFound') { return true; }
            throw error;
        }
    }
}