export class DatabaseError extends Error {
  constructor(public readonly code: "DB_CONFIG" | "DB_UNAVAILABLE") {
    super(
      code === "DB_CONFIG"
        ? "Station database is not configured. Set MONGODB_URI and MONGODB_DB on the server."
        : "Station database is unavailable. Check the database connection and try again.",
    );
    this.name = "DatabaseError";
  }
}
export function publicDatabaseError(error: unknown) {
  return error instanceof DatabaseError
    ? error
    : new DatabaseError("DB_UNAVAILABLE");
}
