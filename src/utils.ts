export function translateQuery(query: any): any {
    if (!query || typeof query !== "object") { return query; }
    const mongoQuery: any = {};
    for (const key in query) {
        if (key.startsWith("$")) { continue; }
        const value = query[key];
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            const newSubQuery: any = {};
            for (const op in value) {
                if (op.startsWith("$")) {
                    switch (op) {
                        case "$startsWith": newSubQuery["$regex"] = `^${value[op]}`; break;
                        case "$endsWith": newSubQuery["$regex"] = `${value[op]}$`; break;
                        case "$between":
                            const [min, max] = value[op];
                            newSubQuery["$gte"] = min;
                            newSubQuery["$lte"] = max;
                            break;
                        default: newSubQuery[op] = value[op]; break;
                    }
                }
            }
            mongoQuery[key] = newSubQuery;
        } else {
            mongoQuery[key] = value;
        }
    }
    return mongoQuery;
}

export function cleanDocs<T>(doc: T): T {
    if (!doc) return doc;
    if (Array.isArray(doc)) {
        return doc.map(cleanDocs) as T;
    }
    if ((doc as any)._vdb_no_id) {
        delete (doc as any)._id;
        delete (doc as any)._vdb_no_id;
    }
    return doc;
}

