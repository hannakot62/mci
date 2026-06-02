-- CreateIndex
CREATE INDEX "TransportUnit_departureLocationId_idx" ON "TransportUnit"("departureLocationId");

-- CreateIndex
CREATE INDEX "TransportUnit_arrivalLocationId_idx" ON "TransportUnit"("arrivalLocationId");

-- CreateIndex
CREATE INDEX "PackagingUnit_transportUnitId_idx" ON "PackagingUnit"("transportUnitId");

-- CreateIndex
CREATE INDEX "PackagingUnit_transportUnitId_depth_idx" ON "PackagingUnit"("transportUnitId", "depth");

-- CreateIndex
CREATE INDEX "PackagingUnit_parentId_idx" ON "PackagingUnit"("parentId");

-- CreateIndex
CREATE INDEX "GoodsItem_packagingUnitId_idx" ON "GoodsItem"("packagingUnitId");

-- CreateIndex
CREATE INDEX "GoodsItem_productId_idx" ON "GoodsItem"("productId");
