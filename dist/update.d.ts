import { VQueryT } from "@wxn0brp/db-core/types/query";
import { MongoDbAction } from "./actions.js";
export declare function update(mongo: MongoDbAction, query: VQueryT.Update): Promise<any>;
export declare function updateOne(mongo: MongoDbAction, query: VQueryT.Update): Promise<any>;
