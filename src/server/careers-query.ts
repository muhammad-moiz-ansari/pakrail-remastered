import "server-only";
import type { Document } from "mongodb";
import { database } from "./db/mongodb";
import {
  CAREER_PAGE_SIZE,
  CareerFilter,
  StoredCareerNotice,
} from "../lib/careers";
import { escapeRegex } from "../lib/station-search";

export async function queryCareers(
  { q, status, page }: { q: string; status: CareerFilter; page: number },
  now = new Date(),
) {
  const db = await database();
  const today = now.toLocaleDateString("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dateStatus: Document = {
    $switch: {
      branches: [
        { case: { $eq: ["$withdrawn", true] }, then: "withdrawn" },
        {
          case: { $ne: [{ $ifNull: ["$explicitClosingInstant", null] }, null] },
          then: {
            $cond: [
              {
                $gte: [
                  {
                    $convert: {
                      input: "$explicitClosingInstant",
                      to: "date",
                      onError: null,
                      onNull: null,
                    },
                  },
                  now,
                ],
              },
              "within-deadline",
              "closed",
            ],
          },
        },
        {
          case: { $eq: [{ $ifNull: ["$closingDate", null] }, null] },
          then: "unknown",
        },
      ],
      default: {
        $cond: [{ $gte: ["$closingDate", today] }, "within-deadline", "closed"],
      },
    },
  };
  const regex = new RegExp(escapeRegex(q), "i");
  const pipeline: Document[] = [
    {
      $match: q
        ? {
            $or: [
              { title: regex },
              { description: regex },
              { departmentLocationRaw: regex },
            ],
          }
        : {},
    },
    { $set: { displayStatus: dateStatus } },
    ...(status !== "all" ? [{ $match: { displayStatus: status } }] : []),
    { $sort: { postedDate: -1, sourceKey: 1 } },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        items: [
          { $skip: (page - 1) * CAREER_PAGE_SIZE },
          { $limit: CAREER_PAGE_SIZE },
          { $project: { _id: 0 } },
        ],
      },
    },
  ];
  const [result] = await db
    .collection<StoredCareerNotice>("careerNotices")
    .aggregate<{
      metadata: { total: number }[];
      items: (StoredCareerNotice & {
        displayStatus: Exclude<CareerFilter, "all">;
      })[];
    }>(pipeline, { maxTimeMS: 5000 })
    .toArray();
  const total = result?.metadata[0]?.total ?? 0;
  const collectionTotal = await db
    .collection("careerNotices")
    .countDocuments({}, { maxTimeMS: 3000 });
  const lastSync = await db
    .collection<StoredCareerNotice>("careerNotices")
    .findOne(
      {},
      {
        sort: { lastSyncedAt: -1 },
        projection: { lastSyncedAt: 1, _id: 0 },
        maxTimeMS: 3000,
      },
    );
  return {
    items: result?.items ?? [],
    total,
    collectionTotal,
    lastSyncedAt: lastSync?.lastSyncedAt ?? null,
    pages: Math.max(1, Math.ceil(total / CAREER_PAGE_SIZE)),
  };
}
