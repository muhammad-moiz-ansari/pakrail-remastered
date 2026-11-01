import type { Db, IndexDescription } from "mongodb";
import { catalogueSchemas, CollectionName } from "../../lib/catalogue/models";

const optionalUnique = (field: string): IndexDescription => ({
  key: { [field]: 1 },
  unique: true,
  partialFilterExpression: { [field]: { $type: "string" } },
  collation: { locale: "en", strength: 2 },
});
export const catalogueIndexes: Record<CollectionName, IndexDescription[]> = {
  stations: [
    optionalUnique("officialCode"),
    { key: { active: 1, name: 1 } },
    { key: { aliases: 1 } },
  ],
  trains: [
    {
      key: { officialNumber: 1, direction: 1, serviceVariant: 1 },
      unique: true,
      partialFilterExpression: { officialNumber: { $type: "string" } },
    },
    { key: { name: 1, active: 1 } },
  ],
  travelClasses: [optionalUnique("code")],
  routes: [
    { key: { trainId: 1, variant: 1 }, unique: true },
    { key: { "stops.stationId": 1 } },
  ],
  schedules: [
    { key: { routeId: 1, effectiveFrom: 1, effectiveTo: 1 }, unique: true },
  ],
  fares: [
    {
      key: {
        routeId: 1,
        originId: 1,
        destinationId: 1,
        classId: 1,
        passengerCategory: 1,
        effectiveFrom: 1,
        effectiveTo: 1,
      },
      unique: true,
    },
    { key: { originId: 1, destinationId: 1, classId: 1 } },
  ],
};
export const collectionName = (name: CollectionName, demo = false) =>
  demo ? `demo_${name}` : name;
export async function initializeIndexes(db: Db, demo = false) {
  for (const name of Object.keys(catalogueSchemas) as CollectionName[])
    await db
      .collection(collectionName(name, demo))
      .createIndexes([
        { key: { id: 1 }, unique: true, name: "stable_id_unique" },
        ...catalogueIndexes[name],
      ]);
}
