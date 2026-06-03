import { describe, expect, it } from 'vitest';
import type { PackagingTreeNode, TransportDetail } from '@/api/client';
import type { CargoNodeData } from '@/features/cargo-flow/cargoNode.types';
import { buildFlowElements } from './buildFlowElements';
import { buildOverviewFlowElements } from './buildOverviewFlowElements';
import { CARGO_TREE_MAX_GRAPH_NODES } from './cargoTree.constants';

function makePackaging(id: string, depth: number, children: PackagingTreeNode[] = []): PackagingTreeNode {
  return {
    id,
    status: 'pending',
    isMci: depth === 0,
    path: `/${id}/`,
    depth,
    packagingType: { id: 'box', name: 'crate' },
    firstLocation: { id: 'a', code: 'AMS', name: 'Amsterdam', type: 'port' },
    lastLocation: { id: 'b', code: 'HAM', name: 'Hamburg', type: 'port' },
    goods: [],
    goodsCount: 0,
    children,
  };
}

describe('buildFlowElements overview mode', () => {
  it('collapses large subtrees instead of skipping the graph', () => {
    const roots = Array.from({ length: 50 }, (_, r) => {
      const children = Array.from({ length: 100 }, (_, c) =>
        makePackaging(`c-${r}-${c}`, 1)
      );
      return makePackaging(`root-${r}`, 0, children);
    });

    const transport: TransportDetail = {
      id: 'transport-1',
      code: 'TRK-1',
      type: 'truck',
      status: 'idle',
      packagingTree: roots,
    };

    const graph = buildFlowElements(transport);

    expect(graph.graphMode).toBe('overview');
    expect(graph.packagingCount).toBe(5050);
    expect(graph.nodes.length).toBeLessThan(CARGO_TREE_MAX_GRAPH_NODES);
    expect(graph.nodes.some((n) => (n.data as { kind?: string }).kind === 'packaging-summary')).toBe(
      true
    );
  });

  it('does not highlight collapsed summary under external packaging MCI', () => {
    const children = Array.from({ length: 20 }, (_, c) =>
      makePackaging(`child-${c}`, 1)
    );
    const root = makePackaging('root-mci', 0, children);
    root.isMci = true;

    const transport: TransportDetail = {
      id: 'transport-1',
      code: 'TRK-1',
      type: 'truck',
      status: 'idle',
      packagingTree: [root],
    };

    const graph = buildOverviewFlowElements(transport, 21);
    const summary = graph.nodes.find((n) => n.id === 'root-mci--collapsed');

    expect(summary).toBeTruthy();
    expect((summary!.data as CargoNodeData).isMci).toBeFalsy();
    expect((summary!.data as CargoNodeData).subtitle).not.toMatch(/MCI/);
  });

  it('legend lists each product SKU once', () => {
    const children = Array.from({ length: 5 }, (_, c) => {
      const leaf = makePackaging(`leaf-${c}`, 1);
      leaf.goods = [
        {
          id: `good-${c}`,
          serialNumber: `SN-${c}`,
          status: 'pending',
          isMci: true,
          product: { id: 'p1', name: 'Panel', sku: 'SKU-PANEL-004' },
          firstLocation: leaf.firstLocation,
          lastLocation: leaf.lastLocation,
        },
      ];
      leaf.goodsCount = 1;
      return leaf;
    });
    const root = makePackaging('root', 0, children);
    root.isMci = true;

    const transport: TransportDetail = {
      id: 'transport-1',
      code: 'TRK-1',
      type: 'truck',
      status: 'idle',
      packagingTree: [root],
    };

    const graph = buildFlowElements(transport);
    expect(graph.legend).toHaveLength(1);
    expect(graph.legend[0]?.sku).toBe('SKU-PANEL-004');
  });
});
