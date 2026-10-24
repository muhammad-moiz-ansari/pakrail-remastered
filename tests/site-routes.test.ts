import { test } from "node:test";
import assert from "node:assert/strict";
import { breadcrumbsForPath, informationPages } from "../src/lib/site-routes";

test("Our people has linked ancestors and a plain current item on direct navigation", () => {
  assert.deepEqual(breadcrumbsForPath("/information/people"), [
    { label: "Pakistan Railways", href: "/" },
    { label: "About us", href: "/information/about" },
    { label: "Our people" },
  ]);
  assert.deepEqual(
    breadcrumbsForPath("/information/people/"),
    breadcrumbsForPath("/information/people"),
  );
});
test("unknown and future routes do not accidentally inherit another page's breadcrumb", () => {
  for (const path of [
    "/",
    "/information/careers",
    "/information/people/history",
    "/information/peoples",
    "/booking/trains-extra",
    "/demo",
  ])
    assert.deepEqual(breadcrumbsForPath(path), []);
  for (const topic of Object.keys(informationPages)) {
    const items = breadcrumbsForPath(`/information/${topic}`);
    assert.ok(items.length >= 2);
    assert.equal(items.at(-1)?.href, undefined);
    assert.ok(items.slice(0, -1).every((item) => item.href?.startsWith("/")));
  }
  assert.equal(
    breadcrumbsForPath("/booking/payment").at(-1)?.label,
    "Test payment",
  );
});
