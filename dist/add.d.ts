import { VQueryT } from "@wxn0brp/db-core/types/query";
import { MongoDbAction } from "./actions.js";
export declare function add(mongo: MongoDbAction, query: VQueryT.Add): Promise<import("@wxn0brp/db-core/types/arg").Arg<import("@wxn0brp/db-core/types/data").Data>>;
export declare function bulkAdd(mongo: MongoDbAction, query: VQueryT.BulkAdd): Promise<import("@wxn0brp/db-core/types/arg").Arg<import("@wxn0brp/db-core/types/data").Data>[]>;
