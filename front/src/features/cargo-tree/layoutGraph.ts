import dagre from '@dagrejs/dagre';
import { Position, type Edge, type Node } from '@xyflow/react';
import type { CargoNodeData } from '@/features/cargo-flow/cargoNode.types';
import { NODE_SIZE } from './cargoTree.constants';

export function layoutGraph(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: 'TB',
    nodesep: 24,
    ranksep: 46,
    edgesep: 12,
    marginx: 16,
    marginy: 16,
  });

  nodes.forEach((node) => {
    const kind = (node.data as CargoNodeData).kind;
    const size = NODE_SIZE[kind];
    g.setNode(node.id, { width: size.width, height: size.height });
  });

  edges.forEach((edge) => g.setEdge(edge.source, edge.target));
  dagre.layout(g);

  return nodes.map((node) => {
    const kind = (node.data as CargoNodeData).kind;
    const { width, height } = NODE_SIZE[kind];
    const pos = g.node(node.id);
    return {
      ...node,
      type: 'cargo',
      position: { x: pos.x - width / 2, y: pos.y - height / 2 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };
  });
}
