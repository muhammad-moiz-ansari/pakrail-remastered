import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  galleryPhotos,
  publishedGallery,
  filterGallery,
} from "../src/lib/gallery";
import { breadcrumbsForPath } from "../src/lib/site-routes";

test("published gallery assets exist, are unique, and retain explicit reuse provenance", () => {
  const photos = publishedGallery(galleryPhotos);
  const hashes = photos.map((photo) => {
    assert.match(photo.src, /^\/images\/[\w/-]+\.jpg$/);
    assert.ok(photo.width > 0 && photo.height > 0);
    assert.ok(
      photo.alt && photo.credit && photo.caption && photo.permissionNote,
    );
    assert.match(
      photo.sourceUrl,
      /^https:\/\/commons.wikimedia.org\/wiki\/File:/,
    );
    assert.match(photo.originalUrl, /^https:\/\/upload.wikimedia.org\//);
    assert.match(
      photo.licenseUrl,
      /^https:\/\/creativecommons.org\/licenses\//,
    );
    return createHash("sha256")
      .update(readFileSync(`public${photo.src}`))
      .digest("hex");
  });
  assert.equal(new Set(photos.map((photo) => photo.id)).size, photos.length);
  assert.equal(
    new Set(photos.map((photo) => photo.originalUrl)).size,
    photos.length,
  );
  assert.equal(new Set(hashes).size, photos.length);
});

test("filters exclude unpublished photographs, preserve order, and support an empty result", () => {
  const hidden = {
    ...galleryPhotos[0],
    id: "permission-pending",
    published: false,
  };
  const input = [hidden, ...galleryPhotos.toReversed()];
  const result = filterGallery(input, "Stations");
  assert.deepEqual(
    result.map((photo) => photo.id),
    ["rawalpindi-station-2016", "lahore-station-2015"],
  );
  assert.equal(
    filterGallery(input, "All photographs").length,
    galleryPhotos.length,
  );
  assert.deepEqual(filterGallery(input, "On board"), []);
  assert.equal(input[0], hidden);
});

test("Gallery has a local route breadcrumb without invented ancestry", () => {
  assert.deepEqual(breadcrumbsForPath("/gallery"), [
    { label: "Pakistan Railways", href: "/" },
    { label: "Gallery" },
  ]);
  assert.deepEqual(
    breadcrumbsForPath("/gallery/"),
    breadcrumbsForPath("/gallery"),
  );
  assert.deepEqual(breadcrumbsForPath("/gallery/unknown"), []);
});
