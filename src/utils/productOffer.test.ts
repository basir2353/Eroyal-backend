import assert from "node:assert/strict";
import {
  applyEffectiveOffer,
  applyOfferToWeightOptions,
  isOfferActive,
  normalizeOfferInput,
  stripWeightOptionSalePrices,
} from "./productOffer.js";

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    throw err;
  }
}

console.log("productOffer tests");

test("inactive when onSale is false", () => {
  assert.equal(
    isOfferActive({ onSale: false, salePrice: 1000, regularPrice: 2500 }),
    false,
  );
});

test("inactive when sale price missing", () => {
  assert.equal(isOfferActive({ onSale: true, salePrice: null, regularPrice: 2500 }), false);
});

test("inactive when sale price >= regular price", () => {
  assert.equal(isOfferActive({ onSale: true, salePrice: 2500, regularPrice: 2500 }), false);
});

test("inactive before start date", () => {
  const future = new Date(Date.now() + 86400000).toISOString();
  assert.equal(
    isOfferActive({
      onSale: true,
      salePrice: 1500,
      regularPrice: 2500,
      offerStartDate: future,
    }),
    false,
  );
});

test("inactive after end date", () => {
  const past = new Date(Date.now() - 86400000).toISOString();
  assert.equal(
    isOfferActive({
      onSale: true,
      salePrice: 1500,
      regularPrice: 2500,
      offerEndDate: past,
    }),
    false,
  );
});

test("active with valid offer", () => {
  assert.equal(
    isOfferActive({ onSale: true, salePrice: 1500, regularPrice: 2500 }),
    true,
  );
});

test("normalizeOfferInput clears fields when disabled", () => {
  const result = normalizeOfferInput({
    onSale: false,
    regularPrice: 2500,
    salePrice: 1500,
    saleBadge: "SALE",
    discountPercent: 40,
  });
  assert.equal(result.onSale, false);
  assert.equal(result.salePrice, null);
  assert.equal(result.saleBadge, null);
  assert.equal(result.discountPercent, null);
});

test("normalizeOfferInput keeps empty badge as null when on sale", () => {
  const result = normalizeOfferInput({
    onSale: true,
    regularPrice: 2500,
    salePrice: 1500,
    saleBadge: "",
  });
  assert.equal(result.onSale, true);
  assert.equal(result.saleBadge, null);
});

test("applyEffectiveOffer keeps null badge for price-only sale", () => {
  const product = applyEffectiveOffer({
    onSale: true,
    salePrice: 1500,
    regularPrice: 2500,
    saleBadge: null,
  });
  assert.equal(product.onSale, true);
  assert.equal(product.saleBadge, null);
});

test("applyEffectiveOffer hides inactive configured offers", () => {
  const product = applyEffectiveOffer({
    onSale: true,
    salePrice: 1500,
    regularPrice: 2500,
    saleBadge: "SALE",
    discountPercent: 40,
    weightOptions: [{ weight: "5kg", price: 1500, salePrice: 1200 }],
  });
  assert.equal(product.onSale, true);
  assert.equal(product.salePrice, 1500);

  const expired = applyEffectiveOffer({
    onSale: true,
    salePrice: 1500,
    regularPrice: 2500,
    saleBadge: "SALE",
    offerEndDate: new Date(Date.now() - 1000).toISOString(),
    weightOptions: [{ weight: "5kg", price: 1500, salePrice: 1200 }],
  });
  assert.equal(expired.onSale, false);
  assert.equal(expired.salePrice, null);
  assert.equal(expired.saleBadge, null);
  assert.deepEqual(expired.weightOptions, [{ weight: "5kg", price: 1500 }]);
});

test("stripWeightOptionSalePrices removes tier sale prices", () => {
  const result = stripWeightOptionSalePrices([
    { weight: "5kg", price: 1500, salePrice: 1200 },
    { weight: "10kg", price: 2500, salePrice: 2000 },
  ]);
  assert.deepEqual(result, [
    { weight: "5kg", price: 1500 },
    { weight: "10kg", price: 2500 },
  ]);
});

test("applyOfferToWeightOptions strips tier prices when disabled", () => {
  const input = [
    { weight: "5kg", price: 1500, salePrice: 1200 },
    { weight: "10kg", price: 2500, salePrice: 2000 },
  ];
  assert.deepEqual(applyOfferToWeightOptions(input, false), [
    { weight: "5kg", price: 1500 },
    { weight: "10kg", price: 2500 },
  ]);
  assert.deepEqual(applyOfferToWeightOptions(input, true), input);
});

console.log("All productOffer tests passed.");
