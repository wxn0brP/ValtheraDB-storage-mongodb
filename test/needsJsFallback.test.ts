import { describe, expect, it } from "bun:test";
import { needsJsFallback } from "../src/utils/index";

describe("needsJsFallback", () => {
    it("1. returns false for null", () => {
        expect(needsJsFallback(null)).toBeFalse();
    });

    it("2. returns false for undefined", () => {
        expect(needsJsFallback(undefined)).toBeFalse();
    });

    it("3. returns false for non-object", () => {
        expect(needsJsFallback("string" as any)).toBeFalse();
        expect(needsJsFallback(42 as any)).toBeFalse();
    });

    it("4. returns false for empty object", () => {
        expect(needsJsFallback({})).toBeFalse();
    });

    it("5. returns false for plain query", () => {
        expect(needsJsFallback({ name: "John", age: 30 })).toBeFalse();
    });

    it("6. returns false for native operators", () => {
        expect(needsJsFallback({ $gt: { age: 5 } })).toBeFalse();
        expect(needsJsFallback({ $regex: { name: "^foo" } })).toBeFalse();
        expect(needsJsFallback({ $in: { status: ["a"] } })).toBeFalse();
    });

    it("7. returns true for $idgt", () => {
        expect(needsJsFallback({ $idgt: { _id: "abc" } })).toBeTrue();
    });

    it("8. returns true for $idlt", () => {
        expect(needsJsFallback({ $idlt: { _id: "abc" } })).toBeTrue();
    });

    it("9. returns true for $idgte", () => {
        expect(needsJsFallback({ $idgte: { _id: "abc" } })).toBeTrue();
    });

    it("10. returns true for $idlte", () => {
        expect(needsJsFallback({ $idlte: { _id: "abc" } })).toBeTrue();
    });

    it("11. returns true for $subset", () => {
        expect(needsJsFallback({ $subset: { tags: ["a"] } })).toBeTrue();
    });

    it("12. returns true for nested $subset in $and", () => {
        expect(needsJsFallback({
            $and: [{ name: "John" }, { $subset: { tags: ["a"] } }],
        })).toBeTrue();
    });

    it("13. returns true for nested $subset in $or", () => {
        expect(needsJsFallback({
            $or: [{ name: "John" }, { $subset: { tags: ["a"] } }],
        })).toBeTrue();
    });

    it("14. returns true for $subset in $not", () => {
        expect(needsJsFallback({ $not: { $subset: { tags: ["a"] } } })).toBeTrue();
    });

    it("15. returns true for $type with unsupported value", () => {
        expect(needsJsFallback({ $type: { field: "undefined" } })).toBeTrue();
        expect(needsJsFallback({ $type: { field: "symbol" } })).toBeTrue();
        expect(needsJsFallback({ $type: { field: "function" } })).toBeTrue();
    });

    it("16. returns false for $type with supported value", () => {
        expect(needsJsFallback({ $type: { field: "string" } })).toBeFalse();
        expect(needsJsFallback({ $type: { field: "number" } })).toBeFalse();
        expect(needsJsFallback({ $type: { field: "boolean" } })).toBeFalse();
    });

    it("17. returns false for $type at field level", () => {
        expect(needsJsFallback({ field: { $type: "undefined" } })).toBeFalse();
    });

    it("18. returns false for plain $and", () => {
        expect(needsJsFallback({
            $and: [{ name: "John" }, { age: 30 }],
        })).toBeFalse();
    });

    it("19. returns false for plain $or", () => {
        expect(needsJsFallback({
            $or: [{ name: "John" }, { age: 30 }],
        })).toBeFalse();
    });
});
