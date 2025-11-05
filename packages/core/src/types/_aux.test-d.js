import { describe, expectTypeOf, it } from 'vitest';
function expectAuxTypes() {
    return expectTypeOf();
}
describe('Aux', () => {
    it('extract types', () => {
        expectAuxTypes().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
    });
    it('replace with never missing tupes', () => {
        expectAuxTypes().toEqualTypeOf();
    });
    it('should work with Unknown', () => {
        expectAuxTypes().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
    });
    it('should work with NEVER', () => {
        expectAuxTypes().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toBeNever();
        expectAuxTypes().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toBeNever();
    });
    it('should work with Any (fallback to Unknown)', () => {
        expectAuxTypes().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
    });
    it('should work with any', () => {
        expectAuxTypes().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        // Check StrictTypes from aux.*
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
        expectTypeOf().toEqualTypeOf();
    });
});
