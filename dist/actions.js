import { ActionsBase } from "@wxn0brp/db-core/base/actions";
import { addId } from "@wxn0brp/db-core/helpers/addId";
import { findUtil } from "@wxn0brp/db-core/utils/action";
import { hasFieldsAdvanced } from "@wxn0brp/db-core/utils/hasFieldsAdvanced";
import { updateFindObject } from "@wxn0brp/db-core/utils/updateFindObject";
import { MongoClient } from "mongodb";
import { cleanDocs, needsJsFallback, translateQuery } from "./utils/index.js";
import { nativeAggregate } from "./utils/aggregate.js";
import { isEmptyUpdate, resolveSearch, translateUpdater } from "./utils/update.js";
export class MongoDbAction extends ActionsBase {
    _client;
    _db;
    constructor(mongoUri, dbName, clientOpts) {
        super();
        this._client = new MongoClient(mongoUri, clientOpts);
        this._db = this._client.db(dbName);
    }
    async init() {
        await this._client.connect();
    }
    async close() {
        await this._client.close();
    }
    _getCollection(name) {
        return this._db.collection(name);
    }
    _applyFindOpts(data, findOpts) {
        if (!findOpts || Object.keys(findOpts).length === 0)
            return data;
        if (Array.isArray(data))
            return data.map(doc => updateFindObject({ ...doc }, findOpts));
        if (data && typeof data === "object")
            return updateFindObject({ ...data }, findOpts);
        return data;
    }
    async add(query) {
        const { collection, data } = query;
        const coll = this._getCollection(collection);
        if (query.id_gen === false && !data._id) {
            const dataToInsert = { ...data, _vdb_no_id: true };
            await coll.insertOne(dataToInsert);
            return data;
        }
        await addId(query, this);
        await coll.insertOne(data);
        return data;
    }
    async find(query) {
        const { collection, search, dbFindOpts = {}, findOpts, context } = query;
        const coll = this._getCollection(collection);
        const { reverse = false, offset = 0, limit = -1, sortBy, sortAsc = true, min, max, avg, groupBy, count } = dbFindOpts;
        const needsAggregation = min || max || avg || groupBy || count;
        const searchIsFunc = typeof search === "function";
        const needsNativeFallback = !searchIsFunc && !needsJsFallback(search);
        const canUseNative = needsNativeFallback && !needsAggregation && sortBy !== "random()" && !(reverse && !sortBy);
        if (canUseNative) {
            const mongoQuery = translateQuery(search);
            let cursor = coll.find(mongoQuery);
            if (sortBy)
                cursor = cursor.sort({ [sortBy]: sortAsc ? 1 : -1 });
            if (offset > 0)
                cursor = cursor.skip(offset);
            if (limit !== -1)
                cursor = cursor.limit(limit);
            const results = await cursor.toArray();
            return this._applyFindOpts(cleanDocs(results), findOpts);
        }
        if (needsAggregation && needsNativeFallback) {
            const mongoQuery = translateQuery(search);
            const results = await nativeAggregate(coll, mongoQuery, dbFindOpts);
            return this._applyFindOpts(results, findOpts);
        }
        if (searchIsFunc) {
            const all = await coll.find({}).toArray();
            let filtered = cleanDocs(all).filter((d) => search(d, context));
            const results = await findUtil(query, filtered, [""]);
            return this._applyFindOpts(results, findOpts);
        }
        if (needsJsFallback(search)) {
            const all = await coll.find({}).toArray();
            const allData = cleanDocs(all).filter((d) => hasFieldsAdvanced(d, search));
            const results = await findUtil(query, allData, [""]);
            return this._applyFindOpts(results, findOpts);
        }
        const mongoQuery = translateQuery(search);
        const results = await coll.find(mongoQuery).toArray();
        const clean = cleanDocs(results);
        const found = await findUtil(query, clean, [""]);
        return this._applyFindOpts(found, findOpts);
    }
    async findOne(query) {
        const { collection, search, findOpts, context } = query;
        const coll = this._getCollection(collection);
        if (typeof search === "function") {
            const all = await coll.find({}).toArray();
            const found = cleanDocs(all).find((d) => search(d, context));
            return this._applyFindOpts(found ?? null, findOpts);
        }
        if (needsJsFallback(search)) {
            const all = await coll.find({}).toArray();
            const found = cleanDocs(all).find((d) => hasFieldsAdvanced(d, search));
            return this._applyFindOpts(found ?? null, findOpts);
        }
        const mongoQuery = translateQuery(search);
        const result = await coll.findOne(mongoQuery);
        return this._applyFindOpts(cleanDocs(result), findOpts);
    }
    async update(query) {
        const { collection, search, updater, context } = query;
        const coll = this._getCollection(collection);
        if (typeof updater === "function") {
            const { filter, allData } = await resolveSearch(search, coll, context);
            const toUpdate = allData ?? await coll.find(filter).toArray();
            const updated = [];
            for (const doc of cleanDocs(toUpdate)) {
                const mod = updater(doc, context);
                if (mod) {
                    await coll.updateOne({ _id: doc._id }, { $set: mod });
                    Object.assign(doc, mod);
                }
                updated.push(doc);
            }
            return updated;
        }
        const { filter, allData } = await resolveSearch(search, coll, context);
        if (allData !== null) {
            const mongoUpdate = translateUpdater(updater);
            if (!isEmptyUpdate(mongoUpdate)) {
                for (const doc of allData) {
                    await coll.updateOne({ _id: doc._id }, mongoUpdate);
                }
            }
            return allData;
        }
        const mongoUpdate = translateUpdater(updater);
        if (!isEmptyUpdate(mongoUpdate)) {
            await coll.updateMany(filter, mongoUpdate);
            const result = await coll.find(filter).toArray();
            return cleanDocs(result);
        }
        const emptyResult = await coll.find(filter).toArray();
        return cleanDocs(emptyResult);
    }
    async updateOne(query) {
        const { collection, search, updater, context } = query;
        const coll = this._getCollection(collection);
        if (typeof updater === "function") {
            const { filter, allData } = await resolveSearch(search, coll, context);
            let doc;
            if (allData !== null) {
                doc = allData[0] ?? null;
            }
            else {
                doc = await coll.findOne(filter);
            }
            if (!doc)
                return null;
            const mod = updater(doc, context);
            if (mod) {
                await coll.updateOne({ _id: doc._id }, { $set: mod });
                Object.assign(doc, mod);
            }
            return cleanDocs(doc);
        }
        const { filter, allData } = await resolveSearch(search, coll, context);
        if (allData !== null) {
            const doc = allData[0] ?? null;
            if (!doc)
                return null;
            const mongoUpdate = translateUpdater(updater);
            if (!isEmptyUpdate(mongoUpdate)) {
                await coll.updateOne({ _id: doc._id }, mongoUpdate);
            }
            return doc;
        }
        const mongoUpdate = translateUpdater(updater);
        const result = await coll.findOne(filter);
        if (!result)
            return null;
        if (!isEmptyUpdate(mongoUpdate)) {
            await coll.updateOne(filter, mongoUpdate);
            const updated = await coll.findOne(filter);
            return cleanDocs(updated);
        }
        return cleanDocs(result);
    }
    async remove(query) {
        const { collection, search, context } = query;
        const coll = this._getCollection(collection);
        const { filter, allData } = await resolveSearch(search, coll, context);
        if (allData !== null) {
            for (const doc of allData) {
                await coll.deleteOne({ _id: doc._id });
            }
            return allData;
        }
        const result = await coll.find(filter).toArray();
        await coll.deleteMany(filter);
        return cleanDocs(result);
    }
    async removeOne(query) {
        const { collection, search, context } = query;
        const coll = this._getCollection(collection);
        const { filter, allData } = await resolveSearch(search, coll, context);
        if (allData !== null) {
            const doc = allData[0] ?? null;
            if (doc)
                await coll.deleteOne({ _id: doc._id });
            return doc;
        }
        const result = await coll.findOne(filter);
        if (result)
            await coll.deleteOne(filter);
        return cleanDocs(result);
    }
    async getCollections() {
        const collections = await this._db.listCollections().toArray();
        return collections.map(c => c.name);
    }
    async ensureCollection(collection) {
        if (await this.issetCollection(collection))
            return false;
        try {
            await this._db.createCollection(collection);
            return true;
        }
        catch (error) {
            if (error.codeName === "NamespaceExists")
                return false;
            throw error;
        }
    }
    async issetCollection(collection) {
        const collections = await this.getCollections();
        return collections.includes(collection);
    }
    async removeCollection(collection) {
        try {
            await this._db.dropCollection(collection);
            return true;
        }
        catch (error) {
            if (error.codeName === "NamespaceNotFound")
                return true;
            throw error;
        }
    }
}
