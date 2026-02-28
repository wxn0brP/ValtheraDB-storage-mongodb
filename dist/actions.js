import { genId } from "@wxn0brp/db-core";
import { ActionsBase } from "@wxn0brp/db-core/base/actions";
import { findUtil } from "@wxn0brp/db-core/utils/action";
import { MongoClient } from "mongodb";
import { cleanDocs, translateQuery } from "./utils.js";
export class MongoDbAction extends ActionsBase {
    logs;
    _client;
    _db;
    constructor(mongoUri, dbName, logs = false) {
        super();
        this.logs = logs;
        this._client = new MongoClient(mongoUri);
        this._db = this._client.db(dbName);
    }
    async init() {
        await this._client.connect();
        if (this.logs)
            console.log(`Connected to MongoDB (${this._db.databaseName})`);
    }
    async close() {
        await this._client.close();
        if (this.logs)
            console.log(`Disconnected from MongoDB (${this._db.databaseName})`);
    }
    _getCollection(name) {
        return this._db.collection(name);
    }
    async add(query) {
        const { collection, data, id_gen = true } = query;
        const coll = this._getCollection(collection);
        if (id_gen === false && !data._id) {
            const dataToInsert = { ...data, _vdb_no_id: true };
            await coll.insertOne(dataToInsert);
            return data;
        }
        if (id_gen && !data._id) {
            data._id = genId();
        }
        await coll.insertOne(data);
        return data;
    }
    async find(query) {
        const { collection, search } = query;
        const coll = this._getCollection(collection);
        const mongoQuery = translateQuery(search);
        const results = await coll.find(mongoQuery).toArray();
        const cleanResults = cleanDocs(results);
        const mockFileCpu = {
            async find(file, search, context, findOpts) {
                return cleanResults;
            },
        };
        return await findUtil(query, mockFileCpu, [""]);
    }
    async findOne(query) {
        const { collection, search } = query;
        const coll = this._getCollection(collection);
        const mongoQuery = translateQuery(search);
        const result = await coll.findOne(mongoQuery);
        return cleanDocs(result);
    }
    async update(query) {
        const { collection, search, updater } = query;
        const coll = this._getCollection(collection);
        const mongoQuery = translateQuery(search);
        await coll.updateMany(mongoQuery, { $set: updater });
        const result = await coll.find(mongoQuery).toArray();
        return cleanDocs(result);
    }
    async updateOne(query) {
        const { collection, search, updater } = query;
        const coll = this._getCollection(collection);
        const mongoQuery = translateQuery(search);
        await coll.updateOne(mongoQuery, { $set: updater });
        const result = await coll.findOne(mongoQuery);
        return cleanDocs(result);
    }
    async remove(query) {
        const { collection, search } = query;
        const coll = this._getCollection(collection);
        const mongoQuery = translateQuery(search);
        const result = await coll.find(mongoQuery).toArray();
        await coll.deleteMany(mongoQuery);
        return cleanDocs(result);
    }
    async removeOne(query) {
        const { collection, search } = query;
        const coll = this._getCollection(collection);
        const mongoQuery = translateQuery(search);
        const result = await coll.findOne(mongoQuery);
        await coll.deleteOne(mongoQuery);
        return cleanDocs(result);
    }
    async getCollections() {
        const collections = await this._db.listCollections().toArray();
        return collections.map(c => c.name);
    }
    async ensureCollection(query) {
        try {
            await this._db.createCollection(query.collection);
            return true;
        }
        catch (error) {
            if (error.codeName === 'NamespaceExists') {
                return true;
            }
            throw error;
        }
    }
    async issetCollection(query) {
        const collections = await this.getCollections();
        return collections.includes(query.collection);
    }
    async removeCollection(query) {
        const { collection } = query;
        try {
            await this._db.dropCollection(collection);
            return true;
        }
        catch (error) {
            if (error.codeName === 'NamespaceNotFound') {
                return true;
            }
            throw error;
        }
    }
}
