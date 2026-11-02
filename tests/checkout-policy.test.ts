import { test } from "node:test";
import assert from "node:assert/strict";
import { safeReturnTo } from "../src/lib/auth-navigation";
import {
  assertDraftAccess,
  assertHold,
  checkoutSnapshot,
  validateCheckout,
  inventoryKeys,
} from "../src/lib/checkout-policy";
import { checkoutFixture } from "./fixtures/checkout";

test("auth redirects allow only known local destinations", () => {
  for (const v of [
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/%2f%2fevil.test",
    "/login",
    "/account?next=evil",
  ])
    assert.equal(safeReturnTo(v), "/account");
  assert.equal(safeReturnTo("/booking/payment"), "/booking/payment");
});
test("claim policy forbids anonymous and cross-account access to owned drafts", () => {
  assert.doesNotThrow(() => assertDraftAccess(null));
  assert.doesNotThrow(() => assertDraftAccess("a", "a"));
  assert.throws(() => assertDraftAccess("a"));
  assert.throws(() => assertDraftAccess("a", "b"));
});
test("expired or absent holds are rejected independently of login", () => {
  const now = new Date();
  assert.throws(() => assertHold(null, now));
  assert.throws(() => assertHold(now, now));
  assert.doesNotThrow(() => assertHold(new Date(now.getTime() + 1), now));
});
test("checkout revalidates current sample trains and rejects forged fares", () => {
  const b = checkoutFixture();
  assert.doesNotThrow(() => validateCheckout(b));
  b.legs[0].train.price = 1;
  assert.throws(() => validateCheckout(b));
});
test("draft extraction rejects client paid status and never adopts owner claims", () => {
  const b = checkoutFixture();
  const extracted = checkoutSnapshot({
    ...b,
    ownerId: "attacker",
    accountBookingId: "00000000-0000-0000-0000-000000000000",
  });
  assert.equal(Object.hasOwn(extracted, "ownerId"), false);
  assert.equal(extracted.accountBookingId, undefined);
  assert.throws(() => checkoutSnapshot({ ...b, status: "paid" }));
});
test("inventory identities preserve both legs, places and dates without exposing identities", () => {
  const b = checkoutFixture(),
    keys = inventoryKeys(b);
  assert.equal(keys.length, 4);
  assert.equal(new Set(keys).size, 4);
  assert.ok(!keys.join().includes(b.passengers[0].name));
});
