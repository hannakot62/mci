import React, { useCallback, useEffect, useMemo } from 'react';
import {
  Background,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
  Position,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';
import type { PackagingTreeNode, TransportDetail } from '../api/client';

interface CargoTreeProps {
  transport: TransportDetail | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#9ca3af',
  loading: '#3b82f6',
  in_transit: '#f59e0b',
  delivered: '#22c55e',
  idle: '#6b7280',
};

function truncateSerial(serial: string): string {
  return serial.length > 8 ? `${serial.slice(0, 8)}…` : serial;
}

function layoutGraph(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 40, ranksep: 70 });

  nodes.forEach((node) => g.setNode(node.id, { width: 180, height: 70 }));
  edges.forEach((edge) => g.setEdge(edge.source, edge.target));

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: { x: pos.x - 90, y: pos.y - 35 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };
  });
}

function buildFlowElements(transport: TransportDetail): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  nodes.push({
    id: transport.id,
    type: 'default',
    data: {
      label: (
        <div className="flow-node transport-node">
          <strong>{transport.code}</strong>
          <span
            className="status-badge"
            style={{ backgroundColor: STATUS_COLORS[transport.status] ?? '#6b7280' }}
          >
            {transport.status}
          </span>
        </div>
      ),
    },
    position: { x: 0, y: 0 },
  });

  const walkPackaging = (parentId: string, items: PackagingTreeNode[]): void => {
    for (const pkg of items) {
      const borderColor = pkg.isMci ? '#eab308' : STATUS_COLORS[pkg.status] ?? '#9ca3af';

      nodes.push({
        id: pkg.id,
        type: 'default',
        data: {
          label: (
            <div
              className={`flow-node packaging-node${pkg.isMci ? ' mci-node' : ''}`}
              style={{ borderColor }}
            >
              <div>
                <strong>{pkg.packagingType.name}</strong>
                {pkg.isMci && <span className="mci-badge">MCI</span>}
              </div>
              <small>
                depth {pkg.depth} · {pkg.status}
              </small>
            </div>
          ),
        },
        position: { x: 0, y: 0 },
      });

      edges.push({ id: `${parentId}-${pkg.id}`, source: parentId, target: pkg.id });

      for (const good of pkg.goods) {
        nodes.push({
          id: good.id,
          type: 'default',
          data: {
            label: (
              <div
                className="flow-node goods-node"
                style={{ borderColor: STATUS_COLORS[good.status] ?? '#9ca3af' }}
              >
                <strong>{good.product.sku}</strong>
                <small>{truncateSerial(good.serialNumber)}</small>
              </div>
            ),
          },
          position: { x: 0, y: 0 },
        });
        edges.push({ id: `${pkg.id}-${good.id}`, source: pkg.id, target: good.id });
      }

      const hiddenGoods = pkg.goodsCount - pkg.goods.length;
      if (hiddenGoods > 0) {
        const summaryId = `${pkg.id}-goods-more`;
        nodes.push({
          id: summaryId,
          type: 'default',
          data: {
            label: (
              <div className="flow-node goods-node goods-summary-node">
                <strong>+{hiddenGoods} more</strong>
                <small>{pkg.goodsTruncated ? 'preview only' : 'not loaded'}</small>
              </div>
            ),
          },
          position: { x: 0, y: 0 },
        });
        edges.push({ id: `${pkg.id}-${summaryId}`, source: pkg.id, target: summaryId });
      }

      walkPackaging(pkg.id, pkg.children);
    }
  };

  walkPackaging(transport.id, transport.packagingTree);

  return { nodes: layoutGraph(nodes, edges), edges };
}

export function CargoTree({ transport }: CargoTreeProps): React.ReactElement {
  const elements = useMemo(
    () => (transport ? buildFlowElements(transport) : { nodes: [], edges: [] }),
    [transport]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(elements.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(elements.edges);

  const syncElements = useCallback(() => {
    setNodes(elements.nodes);
    setEdges(elements.edges);
  }, [elements, setNodes, setEdges]);

  useEffect(() => {
    syncElements();
  }, [syncElements]);

  if (!transport) {
    return (
      <div className="cargo-tree empty">
        <p>Generate cargo to visualize the packaging hierarchy.</p>
      </div>
    );
  }

  return (
    <div className="cargo-tree">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        minZoom={0.2}
        maxZoom={1.5}
      >
        <Background gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
