import { getPrismaClient } from '../config/database';

const prisma = getPrismaClient();

export type PackagingTreeNode = {
  id: string;
  status: string;
  isMci: boolean;
  path: string;
  depth: number;
  packagingType: { id: string; name: string };
  goods: Array<{
    id: string;
    serialNumber: string;
    status: string;
    product: { id: string; name: string; sku: string };
  }>;
  children: PackagingTreeNode[];
};

function buildPackagingTree(
  units: Array<{
    id: string;
    status: string;
    isMci: boolean;
    path: string;
    depth: number;
    parentId: string | null;
    packagingType: { id: string; name: string };
    goods: PackagingTreeNode['goods'];
  }>
): PackagingTreeNode[] {
  const byParent = new Map<string | null, typeof units>();
  for (const unit of units) {
    const key = unit.parentId;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(unit);
  }

  const build = (parentId: string | null): PackagingTreeNode[] => {
    const nodes = byParent.get(parentId) ?? [];
    return nodes.map((node) => ({
      id: node.id,
      status: node.status,
      isMci: node.isMci,
      path: node.path,
      depth: node.depth,
      packagingType: node.packagingType,
      goods: node.goods,
      children: build(node.id),
    }));
  };

  return build(null);
}

export async function listTransports() {
  return prisma.transportUnit.findMany({
    select: {
      id: true,
      code: true,
      type: true,
      status: true,
      createdAt: true,
      departureLocation: { select: { code: true, name: true } },
      arrivalLocation: { select: { code: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getTransportWithTree(id: string) {
  const transport = await prisma.transportUnit.findUnique({
    where: { id },
    include: {
      departureLocation: true,
      arrivalLocation: true,
    },
  });

  if (!transport) return null;

  const packagingUnits = await prisma.packagingUnit.findMany({
    where: { transportUnitId: id },
    include: {
      packagingType: { select: { id: true, name: true } },
      goods: {
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
      },
    },
    orderBy: { depth: 'asc' },
  });

  const tree = buildPackagingTree(
    packagingUnits.map((pu) => ({
      id: pu.id,
      status: pu.status,
      isMci: pu.isMci,
      path: pu.path,
      depth: pu.depth,
      parentId: pu.parentId,
      packagingType: pu.packagingType,
      goods: pu.goods.map((g) => ({
        id: g.id,
        serialNumber: g.serialNumber,
        status: g.status,
        product: g.product,
      })),
    }))
  );

  return {
    ...transport,
    packagingTree: tree,
  };
}

export async function listLocations() {
  return prisma.location.findMany({
    orderBy: { name: 'asc' },
  });
}
