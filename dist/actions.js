import { ActionsBase } from "@wxn0brp/db-core/base/actions";
import { AdapterCloseError, AdapterError, AdapterInitError, ErrorCodes, TransactionError, } from "@wxn0brp/db-core/errors";
import { updateFindObject } from "@wxn0brp/db-core/utils/updateFindObject";
import { MongoClient, } from "mongodb";
import { add, bulkAdd } from "./add.js";
import { find, findOne } from "./find.js";
import { remove, removeOne } from "./remove.js";
import { update, updateOne } from "./update.js";
import { needsJsFallback, translateQuery } from "./utils/index.js";
import { version } from "./version.js";
export class MongoDbAction extends ActionsBase {
    _client;
    _db;
    _session = null;
    version = version;
    capabilities = {
        transactions: true,
        indexes: true,
        persistent: true,
    };
    constructor(mongoUri, dbName, clientOpts) {
        super();
        this._client = new MongoClient(mongoUri, clientOpts);
        this._db = this._client.db(dbName);
    }
    async init() {
        try {
            await this._client.connect();
        }
        catch (err) {
            throw new AdapterInitError(err, {
                db: this._db.databaseName,
            });
        }
    }
    async close() {
        try {
            await this._client.close();
        }
        catch (err) {
            throw new AdapterCloseError(err, {
                db: this._db.databaseName,
            });
        }
    }
    _getCollection(name) {
        return this._db.collection(name);
    }
    _applyFindOpts(data, findOpts) {
        if (!findOpts || Object.keys(findOpts).length === 0)
            return data;
        if (Array.isArray(data))
            return data.map(doc => updateFindObject({
                ...doc,
            }, findOpts));
        if (data && typeof data === "object")
            return updateFindObject({
                ...data,
            }, findOpts);
        return data;
    }
    add(query) {
        return add(this, query);
    }
    bulkAdd(query) {
        return bulkAdd(this, query);
    }
    find(query) {
        return find(this, query);
    }
    findOne(query) {
        return findOne(this, query);
    }
    update(config) {
        return update(this, config);
    }
    updateOne(config) {
        return updateOne(this, config);
    }
    remove(config) {
        return remove(this, config);
    }
    removeOne(config) {
        return removeOne(this, config);
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
            throw new AdapterError(error, {
                op: "ensureCollection",
                collection,
            });
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
            throw new AdapterError(error, {
                op: "removeCollection",
                collection,
            });
        }
    }
    async beginTransaction(id) {
        if (this._session)
            throw new TransactionError("transaction already active", {
                code: ErrorCodes.TRANSACTION_FAILED,
                context: {
                    op: "beginTransaction",
                    handle: id,
                },
            });
        this._session = this._client.startSession();
        this._session.startTransaction();
        return {
            id,
            _adapterData: this._session,
        };
    }
    async commitTransaction(handle) {
        const session = handle._adapterData;
        try {
            await session.commitTransaction();
            await session.endSession();
        }
        catch (err) {
            this._session = null;
            throw new TransactionError("Transaction commit failed", {
                cause: err,
                context: {
                    op: "commitTransaction",
                    handle: handle.id,
                },
            });
        }
        this._session = null;
    }
    async rollbackTransaction(handle) {
        const session = handle._adapterData;
        try {
            await session.abortTransaction();
            await session.endSession();
        }
        catch (err) {
            this._session = null;
            throw new TransactionError("Transaction rollback failed", {
                cause: err,
                context: {
                    op: "rollbackTransaction",
                    handle: handle.id,
                },
            });
        }
        this._session = null;
    }
    async createIndex(config) {
        const { collection, index } = config;
        const { fields, opts } = index;
        const coll = this._getCollection(collection);
        const keys = {};
        for (const field of fields) {
            keys[field] = 1;
        }
        await coll.createIndex(keys, {
            unique: opts?.unique,
            name: opts?.name,
        });
    }
    async removeIndex(config) {
        const { collection, index } = config;
        const { fields, opts } = index;
        const coll = this._getCollection(collection);
        const indexName = opts?.name || `idx_${collection}_${fields.join("_")}`;
        await coll.dropIndex(indexName);
    }
    async count(config) {
        const { collection, search } = config;
        const coll = this._getCollection(collection);
        const opts = this._session
            ? {
                session: this._session,
            }
            : {};
        if (typeof search === "function" || needsJsFallback(search)) {
            return (await this.find(config)).length;
        }
        const mongoQuery = translateQuery(search);
        return await coll.countDocuments(mongoQuery, opts);
    }
}
