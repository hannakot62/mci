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
import type { FlowGraphResult } from './buildFlowElements.types';
import {
  defaultEdgeOptions,
  MAX_GOODS_PER_NODE,
  NODE_SIZE,
  OVERVIEW_COLLAPSE_THRESHOLD,
} from './cargoTree.constants';
import { layoutGraph } from './layoutGraph';
import {
  buildPackagingMciExtras,
  childWalkContext,
  goodsDisplayAsMci,
  packagingDisplayAsMci,
  type MciWalkContext,
} from './mciGraphVisibility';
import { findFirstMciSkuInDescendants, getDescendantMciStats } from './packagingSubtreeStats';
import { mciLegendEntries, trackMciLegendEntry } from './mciLegendTracking';

function truncateSerial(serial: string): string {
  return serial.length > 8 ? `${serial.slice(0, 8)}…` : serial;
}

function routeLabel(from: Location, to: Location): string {
  return `${from.code}→${to.code}`;
}

export function buildOverviewFlowElements(
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

  const appendGoods = (pkg: PackagingTreeNode, ctx: MciWalkContext): void => {
    const visibleGoods = pkg.goods.slice(0, MAX_GOODS_PER_NODE);
    for (const good of visibleGoods) {
      let goodMciExtras: Partial<CargoNodeData> = {};
      const showAsMci = goodsDisplayAsMci(good.isMci, ctx);
      let edgeAccent = ctx.branchAccent;

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
  };

  const walk = (parentId: string, items: PackagingTreeNode[], ctx: MciWalkContext): void => {
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

      appendGoods(pkg, childCtx);

      if (pkg.children.length === 0) {
        continue;
      }

      const descendantStats = getDescendantMciStats(pkg);
      if (descendantStats.descendantCount > OVERVIEW_COLLAPSE_THRESHOLD) {
        const summaryId = `${pkg.id}--collapsed`;
        const descendantMciTotal =
          descendantStats.packagingMciCount + descendantStats.goodsMciCount;
        let summaryMci: Partial<CargoNodeData> = {};

        if (!childCtx.insideMciSubtree && descendantMciTotal > 0) {
          const mciSku = findFirstMciSkuInDescendants(pkg);
          if (mciSku) {
            const palette = productPalette.get(mciSku);
            const accent = palette?.accent ?? '#eab308';
            summaryMci = {
              isMci: true,
              mciProductSku: shortSku(mciSku),
              mciAccent: accent,
              mciSoft: palette?.soft ?? 'rgba(252, 211, 77, 0.34)',
              mciStatusColor: statusColor,
            };
            if (palette) {
              trackMciLegendEntry(legendBySku, mciSku, palette, pkg.status);
            }
          }
        }

        const depthHint =
          descendantStats.maxChildDepth > 0
            ? ` · depth +${descendantStats.maxChildDepth}`
            : '';
        const mciHint =
          !childCtx.insideMciSubtree && descendantMciTotal > 0
            ? ` · ${descendantMciTotal} MCI`
            : '';

        nodes.push({
          id: summaryId,
          type: 'cargo',
          width: sizeFor('packaging-summary').width,
          height: sizeFor('packaging-summary').height,
          data: {
            kind: 'packaging-summary',
            title: `+${descendantStats.descendantCount.toLocaleString('en-US')}`,
            subtitle: `nested units${depthHint}${mciHint}`,
            ...summaryMci,
          } satisfies CargoNodeData,
          position: { x: 0, y: 0 },
        });

        edges.push({
          id: `${pkg.id}-${summaryId}`,
          source: pkg.id,
          target: summaryId,
          style: { strokeDasharray: '4 3', opacity: 0.75 },
        });
        continue;
      }

      walk(pkg.id, pkg.children, childCtx);
    }
  };

  walk(transport.id, transport.packagingTree, { insideMciSubtree: false });

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
    graphMode: 'overview',
    packagingCount,
  };
}
