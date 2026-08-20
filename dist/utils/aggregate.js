import { cleanDocs } from "./index.js";
export async function nativeAggregate(coll, mongoQuery, dbFindOpts) {
    const { min, max, avg, groupBy, count, sortBy, sortAsc, offset = 0, limit = -1, reverse } = dbFindOpts;
    const pipeline = [];
    if (Object.keys(mongoQuery).length > 0) {
        pipeline.push({ $match: mongoQuery });
    }
    const groupStage = { _id: null };
    if (groupBy) {
        const groupFields = Array.isArray(groupBy) ? groupBy : [groupBy];
        if (groupFields.length === 1) {
            groupStage._id = `$${groupFields[0]}`;
        }
        else {
            groupStage._id = {};
            for (const field of groupFields) {
                groupStage._id[field] = `$${field}`;
            }
        }
    }
    if (count) {
        for (const alias in count) {
            const srcField = count[alias];
            groupStage[alias] = { $sum: { $cond: [{ $ne: [`$${srcField}`, null] }, 1, 0] } };
        }
    }
    if (min)
        for (const alias in min)
            groupStage[alias] = { $min: `$${min[alias]}` };
    if (max)
        for (const alias in max)
            groupStage[alias] = { $max: `$${max[alias]}` };
    if (avg)
        for (const alias in avg)
            groupStage[alias] = { $avg: `$${avg[alias]}` };
    pipeline.push({ $group: groupStage });
    const projectStage = { _id: 0 };
    if (groupBy) {
        const groupFields = Array.isArray(groupBy) ? groupBy : [groupBy];
        if (groupFields.length === 1) {
            projectStage[groupFields[0]] = "$_id";
        }
        else {
            for (const field of groupFields) {
                projectStage[field] = `$_id.${field}`;
            }
        }
        if (!sortBy) {
            const sortStage = {};
            for (const field of groupFields) {
                sortStage[field] = 1;
            }
            pipeline.push({ $sort: sortStage });
        }
    }
    if (count)
        for (const alias in count)
            projectStage[alias] = 1;
    if (min)
        for (const alias in min)
            projectStage[alias] = 1;
    if (max)
        for (const alias in max)
            projectStage[alias] = 1;
    if (avg)
        for (const alias in avg)
            projectStage[alias] = 1;
    pipeline.push({ $project: projectStage });
    if (sortBy) {
        pipeline.push({ $sort: { [sortBy]: sortAsc ? 1 : -1 } });
    }
    if (offset > 0)
        pipeline.push({ $skip: offset });
    if (limit !== -1)
        pipeline.push({ $limit: limit });
    let results = await coll.aggregate(pipeline).toArray();
    if (results.length === 0 && !groupBy) {
        const defaultResult = {};
        if (count)
            for (const alias in count)
                defaultResult[alias] = 0;
        if (min)
            for (const alias in min)
                defaultResult[alias] = null;
        if (max)
            for (const alias in max)
                defaultResult[alias] = null;
        if (avg)
            for (const alias in avg)
                defaultResult[alias] = null;
        results.push(defaultResult);
    }
    if (reverse && !sortBy)
        results.reverse();
    return cleanDocs(results);
}
