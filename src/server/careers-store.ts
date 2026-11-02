import type { Db } from "mongodb";
import { CareerNotice, StoredCareerNotice } from "../lib/careers";

export async function careerImportPlan(db: Db, notices: CareerNotice[]) {
  const existing = await db
    .collection<StoredCareerNotice>("careerNotices")
    .find({ sourceKey: { $in: notices.map((n) => n.sourceKey) } })
    .toArray();
  const byKey = new Map(existing.map((n) => [n.sourceKey, n]));
  return notices.map((notice) => ({
    notice,
    before: byKey.get(notice.sourceKey),
    action: !byKey.has(notice.sourceKey)
      ? ("inserted" as const)
      : byKey.get(notice.sourceKey)!.contentHash === notice.contentHash
        ? ("unchanged" as const)
        : ("updated" as const),
  }));
}
export async function applyCareerImport(db: Db, notices: CareerNotice[]) {
  const collection = db.collection<StoredCareerNotice>("careerNotices");
  await collection.createIndexes([
    { key: { sourceKey: 1 }, unique: true, name: "career_source_key_unique" },
    { key: { postedDate: -1, sourceKey: 1 } },
    { key: { closingDate: 1, withdrawn: 1 } },
  ]);
  const plan = await careerImportPlan(db, notices);
  const counts = { inserted: 0, updated: 0, unchanged: 0, failed: 0 };
  const errors: { sourceKey: string; message: string }[] = [];
  for (const item of plan) {
    const now = new Date().toISOString();
    try {
      const { notice, before } = item;
      const metadata = { lastSeenAt: now, lastSyncedAt: now };
      const result = await collection.updateOne(
        { sourceKey: notice.sourceKey },
        item.action === "unchanged"
          ? {
              $set: metadata,
              $addToSet: { sourcePages: { $each: notice.sourcePages } },
            }
          : {
              $set: { ...notice, ...metadata, updatedAt: now },
              $setOnInsert: {
                firstSeenAt: before?.firstSeenAt ?? now,
                createdAt: before?.createdAt ?? now,
              },
            },
        { upsert: true },
      );
      if (result.upsertedCount) counts.inserted++;
      else if (item.action === "updated") counts.updated++;
      else counts.unchanged++;
    } catch {
      counts.failed++;
      errors.push({
        sourceKey: item.notice.sourceKey,
        message:
          "Write failed; existing notices were not removed. Re-run a dry-run before retrying.",
      });
    }
  }
  const stored = await collection.countDocuments({
    sourceKey: { $in: notices.map((n) => n.sourceKey) },
  });
  const total = await collection.countDocuments({});
  return {
    counts,
    errors,
    verifiedImportedSourceCount: stored,
    totalStoredNotices: total,
  };
}
