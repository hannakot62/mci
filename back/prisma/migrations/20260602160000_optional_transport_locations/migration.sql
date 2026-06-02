-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TransportUnit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "departureLocationId" TEXT,
    "arrivalLocationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TransportUnit_departureLocationId_fkey" FOREIGN KEY ("departureLocationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TransportUnit_arrivalLocationId_fkey" FOREIGN KEY ("arrivalLocationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TransportUnit" ("id", "code", "type", "status", "departureLocationId", "arrivalLocationId", "createdAt")
SELECT "id", "code", "type", "status", "departureLocationId", "arrivalLocationId", "createdAt" FROM "TransportUnit";
DROP TABLE "TransportUnit";
ALTER TABLE "new_TransportUnit" RENAME TO "TransportUnit";
CREATE UNIQUE INDEX "TransportUnit_code_key" ON "TransportUnit"("code");
CREATE INDEX "TransportUnit_departureLocationId_idx" ON "TransportUnit"("departureLocationId");
CREATE INDEX "TransportUnit_arrivalLocationId_idx" ON "TransportUnit"("arrivalLocationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
