import { describe, expect, it } from "bun:test";
import { cleanDocs } from "../src/utils/index";

describe("cleanDocs", () => {
    it("1. returns null for null input", () => {
        expect(cleanDocs(null)).toBeNull();
    });

    it("2. returns undefined for undefined input", () => {
        expect(cleanDocs(undefined)).toBeUndefined();
    });

    it("3. returns plain doc unchanged", () => {
        const doc = { _id: "1", name: "Alice", age: 30 };
        const result = cleanDocs(doc);
        expect(result).toEqual(doc);
    });

    it("4. removes _id and _vdb_no_id when _vdb_no_id is true", () => {
        const doc = { _id: "1", _vdb_no_id: true, name: "Test" };
        const result = cleanDocs(doc) as any;
        expect(result._id).toBeUndefined();
        expect(result._vdb_no_id).toBeUndefined();
        expect(result.name).toBe("Test");
    });

    it("5. keeps _id when _vdb_no_id is false", () => {
        const doc = { _id: "1", _vdb_no_id: false, name: "Test" };
        const result = cleanDocs(doc) as any;
        expect(result._id).toBe("1");
        expect(result.name).toBe("Test");
    });

    it("6. keeps _id when _vdb_no_id is absent", () => {
        const doc = { _id: "1", _vdb_no_id: undefined, name: "Test" };
        const result = cleanDocs(doc) as any;
        expect(result._id).toBe("1");
    });

    it("7. cleans array of docs", () => {
        const docs = [
            { _id: "1", _vdb_no_id: true, name: "A" },
            { _id: "2", _vdb_no_id: false, name: "B" },
            { _id: "3", name: "C" },
        ];
        const result = cleanDocs(docs) as any[];
        expect(result[0]._id).toBeUndefined();
        expect(result[0].name).toBe("A");
        expect(result[1]._id).toBe("2");
        expect(result[2]._id).toBe("3");
    });

    it("8. returns empty array for empty array input", () => {
        expect(cleanDocs([])).toEqual([]);
    });

    it("9. handles doc with only _vdb_no_id and no _id", () => {
        const doc = { _vdb_no_id: true, name: "Test" };
        const result = cleanDocs(doc) as any;
        expect(result._vdb_no_id).toBeUndefined();
        expect(result.name).toBe("Test");
    });
});
