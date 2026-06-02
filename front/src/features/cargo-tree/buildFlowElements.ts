import type { Edge, Node } from '@xyflow/react';
import type { Location, PackagingTreeNode, TransportDetail } from '@/api/client';
import type { CargoNodeData } from '@/features/cargo-flow/cargoNode.types';
import type { MciLegendEntry } from '@/features/mci/MciLegend';
import {
  buildProductPaletteMap,
  collectMciProductSkus,
  MCI_STATUS_COLORS,
  resolveProductSkuInSubtree,
  shortSku,
} from '@/features/mci/mciGraphTheme';
import { defaultEdgeOptions, MAX_GOODS_PER_NODE, NODE_SIZE } from './cargoTree.constants';
import { layoutGraph } from './layoutGraph';

function truncateSerial(serial: string): string {
  return serial.length > 8 ? `${serial.slice(0, 8)}…` : serial;
}

function routeLabel(from: Location, to: Location): string {
  return `${from.code}→${to.code}`;
}

export function buildFlowElements(transport: TransportDetail): {
  nodes: Node[];
  edges: Edge[];
  legend: MciLegendEntry[];
} {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const sizeFor = (kind: CargoNodeData['kind']) => NODE_SIZE[kind];

  const productPalette = buildProductPaletteMap(collectMciProductSkus(transport.packagingTree));
  const legendBySku = new Map<string, MciLegendEntry>();

  nodes.push({
    id: transport.id,
    type: 'cargo',
    width: sizeFor('transport').width,
    height: sizeFor('transport').height,
    data: {
      kind: 'transport',
      title: transport.code,
      subtitle: transport.type,
    } satisfies CargoNodeData,
    position: { x: 0, y: 0 },
  });

  const walkPackaging = (
    parentId: string,
    items: PackagingTreeNode[],
    activeMciAccent?: string
  ): void => {
    for (const pkg of items) {
      const statusColor = MCI_STATUS_COLORS[pkg.status] ?? '#94a3b8';
      let mciExtras: Partial<CargoNodeData> = {};

      if (pkg.isMci) {
        const sku = resolveProductSkuInSubtree(pkg);
        const palette = productPalette.get(sku);
        const accent = palette?.accent ?? '#eab308';
        const soft = palette?.soft ?? 'rgba(252, 211, 77, 0.34)';

        mciExtras = {
          mciProductSku: shortSku(sku),
          mciAccent: accent,
          mciSoft: soft,
          mciStatusColor: statusColor,
        };

        if (sku !== '—' && palette) {
          legendBySku.set(sku, { sku, palette, status: pkg.status });
        }
      }

      nodes.push({
        id: pkg.id,
        type: 'cargo',
        width: sizeFor('packaging').width,
        height: sizeFor('packaging').height,
        data: {
          kind: 'packaging',
          title: pkg.packagingType.name,
          subtitle: `d${pkg.depth}`,
          route: routeLabel(pkg.firstLocation, pkg.lastLocation),
          status: pkg.status,
          statusColor,
          isMci: pkg.isMci,
          ...mciExtras,
        } satisfies CargoNodeData,
        position: { x: 0, y: 0 },
      });

      const branchAccent = pkg.isMci ? mciExtras.mciAccent : activeMciAccent;
      const edgeStyle = branchAccent
        ? { stroke: branchAccent, strokeWidth: pkg.isMci ? 2 : 1.5, opacity: 0.9 }
        : undefined;

      edges.push({
        id: `${parentId}-${pkg.id}`,
        source: parentId,
        target: pkg.id,
        ...(edgeStyle ? { style: edgeStyle } : {}),
      });

      const visibleGoods = pkg.goods.slice(0, MAX_GOODS_PER_NODE);
      for (const good of visibleGoods) {
        let goodMciExtras: Partial<CargoNodeData> = {};
        let goodAccent = branchAccent;

        if (good.isMci) {
          const sku = good.product.sku;
          const palette = productPalette.get(sku);
          const accent = palette?.accent ?? '#eab308';
          const soft = palette?.soft ?? 'rgba(252, 211, 77, 0.34)';
          const goodStatusColor = MCI_STATUS_COLORS[good.status] ?? '#94a3b8';

          goodMciExtras = {
            isMci: true,
            mciProductSku: shortSku(sku),
            mciAccent: accent,
            mciSoft: soft,
            mciStatusColor: goodStatusColor,
            statusColor: goodStatusColor,
          };
          goodAccent = accent;

          if (palette) {
            legendBySku.set(`${sku}@${good.id}`, { sku, palette, status: good.status });
          }
        }

        nodes.push({
          id: good.id,
          type: 'cargo',
          width: sizeFor('goods').width,
          height: sizeFor('goods').height,
          data: {
            kind: 'goods',
            title: good.product.sku,
            subtitle: truncateSerial(good.serialNumber),
            status: good.status,
            statusColor: MCI_STATUS_COLORS[good.status] ?? '#94a3b8',
            ...goodMciExtras,
          } satisfies CargoNodeData,
          position: { x: 0, y: 0 },
        });
        edges.push({
          id: `${pkg.id}-${good.id}`,
          source: pkg.id,
          target: good.id,
          ...(goodAccent
            ? {
                style: {
                  stroke: goodAccent,
                  strokeWidth: good.isMci ? 2 : 1.25,
                  opacity: good.isMci ? 0.9 : 0.55,
                },
              }
            : {}),
        });
      }

      const hiddenGoods = Math.max(0, pkg.goodsCount - visibleGoods.length);
      if (hiddenGoods > 0) {
        const summaryId = `${pkg.id}-goods-more`;
        nodes.push({
          id: summaryId,
          type: 'cargo',
          width: sizeFor('goods-summary').width,
          height: sizeFor('goods-summary').height,
          data: {
            kind: 'goods-summary',
            title: `+${hiddenGoods}`,
            subtitle: 'items',
          } satisfies CargoNodeData,
          position: { x: 0, y: 0 },
        });
        edges.push({ id: `${pkg.id}-${summaryId}`, source: pkg.id, target: summaryId });
      }

      walkPackaging(pkg.id, pkg.children, branchAccent);
    }
  };

  walkPackaging(transport.id, transport.packagingTree);

  const laidOut = layoutGraph(nodes, edges);
  const styledEdges = edges.map((e) => ({
    ...defaultEdgeOptions,
    ...e,
    style: { ...defaultEdgeOptions.style, ...e.style },
  }));

  return {
    nodes: laidOut,
    edges: styledEdges,
    legend: [...legendBySku.values()],
  };
}
