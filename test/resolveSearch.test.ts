import { describe, expect, it, mock } from "bun:test";
import { resolveSearch } from "../src/utils/update";

function mockCollection(docs: any[]) {
    return {
        find: () => ({
            toArray: () => Promise.resolve(docs),
        }),
    } as any;
}

describe("resolveSearch", () => {
    const docs = [
        { _id: "1", name: "Alice", age: 30, tags: ["a", "b"] },
        { _id: "2", name: "Bob", age: 25, tags: ["b"] },
        { _id: "3", name: "Charlie", age: 35, tags: ["a", "c"] },
        { _id: "4", name: "Diana", age: 28, tags: [] },
    ];

    describe("function search", () => {
        it("1. filters documents by function search", async () => {
            const search = (d: any) => d.age === 30;
            const { filter, allData } = await resolveSearch(search, mockCollection(docs));

            expect(filter).toBeNull();
            expect(allData).toHaveLength(1);
            expect(allData![0].name).toBe("Alice");
        });

        it("2. passes context to search function", async () => {
            const search = (d: any, ctx: any) => d.age >= ctx.minAge;
            const { allData } = await resolveSearch(search, mockCollection(docs), { minAge: 30 });

            expect(allData).toHaveLength(2);
            expect(allData!.map((d: any) => d.name).sort()).toEqual(["Alice", "Charlie"]);
        });

        it("3. returns empty array when no match", async () => {
            const search = (d: any) => d.age > 100;
            const { allData } = await resolveSearch(search, mockCollection(docs));

            expect(allData).toEqual([]);
        });

        it("4. returns all documents when function matches all", async () => {
            const search = (d: any) => d.age > 0;
            const { allData } = await resolveSearch(search, mockCollection(docs));

            expect(allData).toHaveLength(4);
        });

        it("5. removes _vdb_no_id helper fields", async () => {
            const docsWithVdb = [
                { _id: "1", _vdb_no_id: true, name: "Test" },
            ];
            const search = (d: any) => true;
            const { allData } = await resolveSearch(search, mockCollection(docsWithVdb));

            expect(allData![0]._id).toBeUndefined();
            expect(allData![0]._vdb_no_id).toBeUndefined();
            expect(allData![0].name).toBe("Test");
        });

        it("6. filters correctly with _vdb_no_id docs mixed in", async () => {
            const mixedDocs = [
                { _id: "1", name: "Keep", _vdb_no_id: false },
                { _id: "2", name: "Remove", _vdb_no_id: true },
            ];
            const search = (d: any) => d.name === "Keep";
            const { allData } = await resolveSearch(search, mockCollection(mixedDocs));

            expect(allData).toHaveLength(1);
            expect(allData![0]._id).toBe("1");
            expect(allData![0].name).toBe("Keep");
        });
    });

    describe("object search with JS fallback", () => {
        it("1. filters using hasFieldsAdvanced for $subset", async () => {
            const search = { $subset: { tags: ["a"] } };
            const { filter, allData } = await resolveSearch(search, mockCollection(docs));

            expect(filter).toBeNull();
            expect(allData).toHaveLength(2);
            expect(allData!.map((d: any) => d.name).sort()).toEqual(["Alice", "Charlie"]);
        });

        it("2. $subset with no match returns empty", async () => {
            const search = { $subset: { tags: ["x"] } };
            const { allData } = await resolveSearch(search, mockCollection(docs));

            expect(allData).toEqual([]);
        });

        it("3. returns filter null when JS fallback", async () => {
            const search = { $subset: { tags: ["b"] } };
            const { filter } = await resolveSearch(search, mockCollection(docs));

            expect(filter).toBeNull();
        });
    });

    describe("object search (native)", () => {
        it("1. returns translated mongo query as filter", async () => {
            const { filter, allData } = await resolveSearch({ name: "Alice" }, mockCollection(docs));

            expect(allData).toBeNull();
            expect(filter).toEqual({ name: "Alice" });
        });

        it("2. works with operators", async () => {
            const { filter } = await resolveSearch({ $gt: { age: 25 } }, mockCollection(docs));

            expect(filter).toEqual({ age: { $gt: 25 } });
        });

        it("3. works with compound query", async () => {
            const { filter } = await resolveSearch(
                { name: "Alice", $gt: { age: 20 } },
                mockCollection(docs),
            );

            expect(filter).not.toBeNull();
            expect(filter.name).toBe("Alice");
        });

        it("4. works with translated nested operators (Bug 4 fix)", async () => {
            const { filter } = await resolveSearch(
                { name: { $regex: "^A" } },
                mockCollection(docs),
            );

            expect(filter).toEqual({ name: { $regex: "^A" } });
        });
    });

    describe("edge cases", () => {
        it("1. handles empty collection with function search", async () => {
            const search = (d: any) => true;
            const { allData } = await resolveSearch(search, mockCollection([]));

            expect(allData).toEqual([]);
        });

        it("2. handles empty collection with object search", async () => {
            const { filter, allData } = await resolveSearch({ name: "X" }, mockCollection([]));

            expect(allData).toBeNull();
            expect(filter).toEqual({ name: "X" });
        });

        it("3. handles empty collection with JS fallback search", async () => {
            const search = { $subset: { tags: ["a"] } };
            const { allData } = await resolveSearch(search, mockCollection([]));

            expect(allData).toEqual([]);
        });
    });
});
