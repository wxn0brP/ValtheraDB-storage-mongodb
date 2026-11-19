import { VQueryT } from "@wxn0brp/db-core/types/query";
import { MongoDbAdapter } from "./adapter.js";
export declare function update(mongo: MongoDbAdapter, query: VQueryT.Update): Promise<any>;
export declare function updateOne(mongo: MongoDbAdapter, query: VQueryT.Update): Promise<any>;
