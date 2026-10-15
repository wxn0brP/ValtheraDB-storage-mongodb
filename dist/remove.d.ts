import { VQueryT } from "@wxn0brp/db-core/types/query";
import { MongoDbAction } from "./actions.js";
export declare function remove(mongo: MongoDbAction, query: VQueryT.Remove): Promise<any>;
export declare function removeOne(mongo: MongoDbAction, query: VQueryT.Remove): Promise<any>;
