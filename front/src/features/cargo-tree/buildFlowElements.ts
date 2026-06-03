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
import {
  CARGO_TREE_MAX_GRAPH_NODES,
  defaultEdgeOptions,
  MAX_GOODS_PER_NODE,
  NODE_SIZE,
} from './cargoTree.constants';
import { layoutGraph } from './layoutGraph';
import { buildOverviewFlowElements } from './buildOverviewFlowElements';
import type { FlowGraphResult } from './buildFlowElements.types';
import { countPackagingNodes } from './countPackagingNodes';
import { mciLegendEntries, trackMciLegendEntry } from './mciLegendTracking';
import {
  buildPackagingMciExtras,
  childWalkContext,
  goodsDisplayAsMci,
  packagingDisplayAsMci,
  type MciWalkContext,
} from './mciGraphVisibility';

function truncateSerial(serial: string): string {
  return serial.length > 8 ? `${serial.slice(0, 8)}…` : serial;
}

function routeLabel(from: Location, to: Location): string {
  return `${from.code}→${to.code}`;
}

export function buildFlowElements(transport: TransportDetail): FlowGraphResult {
  const packagingCount = countPackagingNodes(transport.packagingTree);
  if (packagingCount > CARGO_TREE_MAX_GRAPH_NODES) {
    return buildOverviewFlowElements(transport, packagingCount);
  }
  return buildFullFlowElements(transport, packagingCount);
}

function buildFullFlowElements(
  transport: TransportDetail,
  packagingCount: number
): FlowGraphResult {
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
    ctx: MciWalkContext
  ): void => {
    for (const pkg of items) {
      const statusColor = MCI_STATUS_COLORS[pkg.status] ?? '#94a3b8';
      const displayAsMci = packagingDisplayAsMci(pkg, ctx);
      let mciExtras: Partial<CargoNodeData> = {};

      if (displayAsMci) {
        mciExtras = buildPackagingMciExtras(pkg, productPalette);
        const sku = resolveProductSkuInSubtree(pkg);
        const palette = productPalette.get(sku);
        if (sku !== '—' && palette) {
          trackMciLegendEntry(legendBySku, sku, palette, pkg.status);
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
          isMci: displayAsMci,
          ...mciExtras,
        } satisfies CargoNodeData,
        position: { x: 0, y: 0 },
      });

      const childCtx = childWalkContext(pkg, ctx, mciExtras);
      const edgeStyle =
        displayAsMci && mciExtras.mciAccent
          ? { stroke: mciExtras.mciAccent, strokeWidth: 2, opacity: 0.9 }
          : childCtx.branchAccent && !childCtx.insideMciSubtree
            ? { stroke: childCtx.branchAccent, strokeWidth: 1.5, opacity: 0.9 }
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
        const showAsMci = goodsDisplayAsMci(good.isMci, childCtx);
        let edgeAccent = childCtx.branchAccent;

        if (showAsMci) {
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
          edgeAccent = accent;

          if (palette) {
            trackMciLegendEntry(legendBySku, sku, palette, good.status);
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
          ...(edgeAccent && showAsMci
            ? {
                style: {
                  stroke: edgeAccent,
                  strokeWidth: 2,
                  opacity: 0.9,
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

      walkPackaging(pkg.id, pkg.children, childCtx);
    }
  };

  walkPackaging(transport.id, transport.packagingTree, { insideMciSubtree: false });

  const laidOut = layoutGraph(nodes, edges);
  const styledEdges = edges.map((e) => ({
    ...defaultEdgeOptions,
    ...e,
    style: { ...defaultEdgeOptions.style, ...e.style },
  }));

  return {
    nodes: laidOut,
    edges: styledEdges,
    legend: mciLegendEntries(legendBySku),
    graphMode: 'full',
    packagingCount,
  };
}
