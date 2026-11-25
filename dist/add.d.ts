import { VQueryT } from "@wxn0brp/db-core/types/query";
import { MongoDbAdapter } from "./adapter.js";
export declare function add(mongo: MongoDbAdapter, query: VQueryT.Add): Promise<import("@wxn0brp/db-core/types/utils").FieldsOf<import("@wxn0brp/db-core/types/utils").WithId<import("@wxn0brp/db-core/types/data").Data>>>;
export declare function bulkAdd(mongo: MongoDbAdapter, query: VQueryT.BulkAdd): Promise<import("@wxn0brp/db-core/types/utils").FieldsOf<import("@wxn0brp/db-core/types/utils").WithId<import("@wxn0brp/db-core/types/data").Data>>[]>;
