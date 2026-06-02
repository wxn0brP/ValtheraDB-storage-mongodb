import { hasFieldsAdvanced } from "@wxn0brp/db-core/utils/hasFieldsAdvanced";
import { cleanDocs, needsJsFallback, translateQuery } from "./index.js";
export function translateUpdater(updater) {
    if (!updater || typeof updater !== "object")
        return { $set: updater };
    const mongoUpdate = {};
    const directSet = {};
    for (const key in updater) {
        if (!key.startsWith("$")) {
            directSet[key] = updater[key];
            continue;
        }
        const op = key.toLowerCase();
        const val = updater[key];
        if (typeof val !== "object" || val === null) {
            directSet[key] = val;
            continue;
        }
        switch (op) {
            case "$inc":
                mongoUpdate.$inc ??= {};
                Object.assign(mongoUpdate.$inc, val);
                break;
            case "$dec":
                mongoUpdate.$inc ??= {};
                for (const f in val)
                    mongoUpdate.$inc[f] = -val[f];
                break;
            case "$push":
                mongoUpdate.$push ??= {};
                Object.assign(mongoUpdate.$push, val);
                break;
            case "$pushset":
                mongoUpdate.$addToSet ??= {};
                Object.assign(mongoUpdate.$addToSet, val);
                break;
            case "$pull":
                mongoUpdate.$pull ??= {};
                Object.assign(mongoUpdate.$pull, val);
                break;
            case "$pullall":
                mongoUpdate.$pull ??= {};
                for (const f in val)
                    mongoUpdate.$pull[f] = { $in: val[f] };
                break;
            case "$unset":
                mongoUpdate.$unset ??= {};
                for (const f in val)
                    mongoUpdate.$unset[f] = "";
                break;
            case "$rename":
                mongoUpdate.$rename ??= {};
                Object.assign(mongoUpdate.$rename, val);
                break;
            case "$set":
                mongoUpdate.$set ??= {};
                Object.assign(mongoUpdate.$set, val);
                break;
            case "$merge":
                mongoUpdate.$set ??= {};
                for (const f in val) {
                    if (typeof val[f] === "object" && val[f] !== null && !Array.isArray(val[f])) {
                        for (const sf in val[f]) {
                            mongoUpdate.$set[`${f}.${sf}`] = val[f][sf];
                        }
                    }
                    else {
                        mongoUpdate.$set[f] = val[f];
                    }
                }
                break;
            case "$deepmerge":
                mongoUpdate.$set ??= {};
                flattenDeep(val, "", mongoUpdate.$set);
                break;
            default:
                directSet[key] = val;
                break;
        }
    }
    if (Object.keys(directSet).length) {
        mongoUpdate.$set ??= {};
        Object.assign(mongoUpdate.$set, directSet);
    }
    return mongoUpdate;
}
function flattenDeep(obj, prefix, target) {
    for (const key in obj) {
        const path = prefix ? `${prefix}.${key}` : key;
        const val = obj[key];
        if (typeof val === "object" && val !== null && !Array.isArray(val)) {
            flattenDeep(val, path, target);
        }
        else {
            target[path] = val;
        }
    }
}
export function isEmptyUpdate(mu) {
    if (!mu || Object.keys(mu).length === 0)
        return true;
    for (const op in mu) {
        if (typeof mu[op] === "object" && mu[op] !== null && Object.keys(mu[op]).length > 0) {
            return false;
        }
    }
    return true;
}
export async function resolveSearch(search, coll, context) {
    if (typeof search === "function") {
        const all = await coll.find({}).toArray();
        const filtered = cleanDocs(all).filter((d) => search(d, context));
        return { filter: null, allData: filtered };
    }
    const mongoQuery = translateQuery(search);
    if (needsJsFallback(search)) {
        const all = await coll.find({}).toArray();
        const allData = cleanDocs(all).filter((d) => hasFieldsAdvanced(d, search));
        return { filter: null, allData };
    }
    return { filter: mongoQuery, allData: null };
}
