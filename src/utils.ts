export function translateQuery(query: any): any {
    if (!query || typeof query !== "object") { return query; }
    const mongoQuery: any = {};
    for (const key in query) {
        if (key.startsWith("$"))
            continue;

        const value = query[key];
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            const newSubQuery: any = {};

            for (const op in value)
                if (op.startsWith("$"))
                    newSubQuery[op] = translateQueryOperator(op, value[op]);

            mongoQuery[key] = newSubQuery;
        } else {
            mongoQuery[key] = value;
        }
    }
    return mongoQuery;
}

function translateQueryOperator(operator: string, value: any): any {
    switch (operator) {
        case "$startsWith": return { $regex: `^${value}` };
        case "$endsWith": return { $regex: `${value}$` };
        case "$between":
            const [min, max] = value;
            return { $gte: min, $lte: max };
        default: return { [operator]: value };
    }
}

export function cleanDocs<T>(doc: T): T {
    if (!doc) return doc;
    if (Array.isArray(doc)) {
        return doc.map(cleanDocs) as T;
    }
    const d = doc as any;
    if (d._vdb_no_id) {
        delete d._id;
        delete d._vdb_no_id;
    }
    return d;
}

