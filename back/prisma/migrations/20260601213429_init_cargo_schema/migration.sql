/*
  Warnings:

  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Post";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "TransportUnit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "departureLocationId" TEXT NOT NULL,
    "arrivalLocationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TransportUnit_departureLocationId_fkey" FOREIGN KEY ("departureLocationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TransportUnit_arrivalLocationId_fkey" FOREIGN KEY ("arrivalLocationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PackagingType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "maxWeightKg" REAL,
    "maxVolumeLiters" REAL
);

-- CreateTable
CREATE TABLE "PackagingUnit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "isMci" BOOLEAN NOT NULL DEFAULT false,
    "path" TEXT NOT NULL DEFAULT '',
    "depth" INTEGER NOT NULL DEFAULT 0,
    "transportUnitId" TEXT,
    "parentId" TEXT,
    "packagingTypeId" TEXT NOT NULL,
    "firstLocationId" TEXT NOT NULL,
    "lastLocationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PackagingUnit_transportUnitId_fkey" FOREIGN KEY ("transportUnitId") REFERENCES "TransportUnit" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PackagingUnit_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "PackagingUnit" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PackagingUnit_packagingTypeId_fkey" FOREIGN KEY ("packagingTypeId") REFERENCES "PackagingType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PackagingUnit_firstLocationId_fkey" FOREIGN KEY ("firstLocationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PackagingUnit_lastLocationId_fkey" FOREIGN KEY ("lastLocationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "allowedPackagingTypes" TEXT NOT NULL DEFAULT 'box,crate'
);

-- CreateTable
CREATE TABLE "GoodsItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serialNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "packagingUnitId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "firstLocationId" TEXT NOT NULL,
    "lastLocationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GoodsItem_packagingUnitId_fkey" FOREIGN KEY ("packagingUnitId") REFERENCES "PackagingUnit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GoodsItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GoodsItem_firstLocationId_fkey" FOREIGN KEY ("firstLocationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GoodsItem_lastLocationId_fkey" FOREIGN KEY ("lastLocationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Location_code_key" ON "Location"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TransportUnit_code_key" ON "TransportUnit"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PackagingType_name_key" ON "PackagingType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsItem_serialNumber_key" ON "GoodsItem"("serialNumber");
