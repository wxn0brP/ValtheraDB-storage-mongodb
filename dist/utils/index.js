const JS_FALLBACK_OPS = new Set(["$idgt", "$idlt", "$idgte", "$idlte", "$subset"]);
const UNSUPPORTED_TYPE_VALUES = new Set(["undefined", "symbol", "function"]);
const TYPE_MAP = {
    string: "string",
    number: "number",
    boolean: "bool",
    object: "object",
    bigint: "long",
};
export function translateQuery(query) {
    if (!query || typeof query !== "object")
        return query;
    if (query.$and) {
        if (!Array.isArray(query.$and) || query.$and.length === 0)
            return {};
        return { $and: query.$and.map((q) => translateQuery(q)) };
    }
    if (query.$or) {
        if (!Array.isArray(query.$or) || query.$or.length === 0)
            return { _id: null };
        return { $or: query.$or.map((q) => translateQuery(q)) };
    }
    const $fields = {};
    const exactFields = {};
    for (const key in query) {
        if (key.startsWith("$")) {
            $fields[key.toLowerCase()] = query[key];
        }
        else {
            exactFields[key] = query[key];
        }
    }
    const mongoQuery = {};
    for (const key in exactFields) {
        const val = exactFields[key];
        if (typeof val === "object" && val !== null && !Array.isArray(val)) {
            const nested = translateQuery(val);
            if (nested && typeof nested === "object" && !Array.isArray(nested) && !nested.$and && !nested.$or && !nested.$not && Object.keys(nested).length > 0) {
                for (const nk in nested) {
                    mongoQuery[`${key}.${nk}`] = nested[nk];
                }
            }
            else {
                mongoQuery[key] = val;
            }
        }
        else {
            mongoQuery[key] = val;
        }
    }
    const fieldOps = {};
    for (const op in $fields) {
        if (JS_FALLBACK_OPS.has(op) || op === "$not")
            continue;
        const val = $fields[op];
        if (typeof val !== "object" || val === null)
            continue;
        for (const field in val) {
            fieldOps[field] ??= {};
            translateOperator(op, val[field], fieldOps[field]);
        }
    }
    if ("$not" in $fields) {
        const notSub = $fields.$not;
        if (typeof notSub === "object" && notSub !== null) {
            const translated = translateQuery(notSub);
            for (const f in translated) {
                if (f === "$and" || f === "$or") {
                    mongoQuery.$and ??= [];
                    mongoQuery.$and.push({ $nor: [translated] });
                }
                else if (typeof translated[f] === "object" && !Array.isArray(translated[f]) && translated[f] !== null) {
                    fieldOps[f] ??= {};
                    fieldOps[f].$not = translated[f];
                }
                else {
                    fieldOps[f] ??= {};
                    fieldOps[f].$ne = translated[f];
                }
            }
        }
    }
    for (const field in fieldOps) {
        if (mongoQuery[field] !== undefined) {
            mongoQuery.$and ??= [];
            mongoQuery.$and.push({ [field]: mongoQuery[field] }, { [field]: fieldOps[field] });
            delete mongoQuery[field];
        }
        else {
            mongoQuery[field] = fieldOps[field];
        }
    }
    return mongoQuery;
}
function translateOperator(op, value, target) {
    switch (op) {
        case "$gt":
        case "$lt":
        case "$gte":
        case "$lte":
        case "$in":
        case "$nin":
        case "$size":
            target[op] = value;
            break;
        case "$exists":
            target.$exists = value;
            break;
        case "$regex":
            if (value instanceof RegExp) {
                target.$regex = value.source;
                if (value.flags)
                    target.$options = value.flags;
            }
            else {
                target.$regex = value;
            }
            break;
        case "$startswith":
            target.$regex = `^${escapeRegex(value)}`;
            break;
        case "$endswith":
            target.$regex = `${escapeRegex(value)}$`;
            break;
        case "$between": {
            if (Array.isArray(value)) {
                if (value[0] !== undefined)
                    target.$gte = value[0];
                if (value[1] !== undefined)
                    target.$lte = value[1];
            }
            break;
        }
        case "$type":
            target.$type = TYPE_MAP[value] ?? value;
            break;
        case "$arrinc":
            target.$in = value;
            break;
        case "$arrincall":
            target.$all = value;
            break;
    }
}
export function needsJsFallback(query) {
    if (!query || typeof query !== "object")
        return false;
    if (query.$and)
        return query.$and.some((q) => needsJsFallback(q));
    if (query.$or)
        return query.$or.some((q) => needsJsFallback(q));
    if (query.$not)
        return needsJsFallback(query.$not);
    for (const key in query) {
        if (key.startsWith("$") && JS_FALLBACK_OPS.has(key.toLowerCase()))
            return true;
        if (key.toLowerCase() === "$type") {
            const val = query[key];
            if (typeof val === "object" && val !== null) {
                for (const field in val) {
                    if (UNSUPPORTED_TYPE_VALUES.has(val[field]))
                        return true;
                }
            }
        }
        if (typeof query[key] === "object" && query[key] !== null) {
            if (needsJsFallback(query[key]))
                return true;
        }
    }
    return false;
}
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
export function cleanDocs(doc) {
    if (!doc)
        return doc;
    if (Array.isArray(doc)) {
        return doc.map(cleanDocs);
    }
    const d = doc;
    if (d._vdb_no_id) {
        delete d._id;
        delete d._vdb_no_id;
    }
    return d;
}
