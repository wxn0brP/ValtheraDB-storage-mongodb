import { VQueryT } from "@wxn0brp/db-core/types/query";
import { MongoDbAdapter } from "./adapter.js";
export declare function remove(mongo: MongoDbAdapter, query: VQueryT.Remove): Promise<any>;
export declare function removeOne(mongo: MongoDbAdapter, query: VQueryT.Remove): Promise<any>;
