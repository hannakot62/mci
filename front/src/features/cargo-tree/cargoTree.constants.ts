import type { CargoNodeData } from '@/features/cargo-flow/cargoNode.types';
import { CargoFlowNode } from '@/features/cargo-flow/CargoFlowNode';

export const MAX_GOODS_PER_NODE = 2;

/** React Flow full layout is capped above this many packaging nodes. */
export const CARGO_TREE_MAX_GRAPH_NODES = 2_500;

/** In overview mode, subtrees larger than this collapse into one summary node. */
export const OVERVIEW_COLLAPSE_THRESHOLD = 15;

export const NODE_SIZE: Record<CargoNodeData['kind'], { width: number; height: number }> = {
  transport: { width: 148, height: 46 },
  packaging: { width: 158, height: 62 },
  goods: { width: 132, height: 52 },
  'goods-summary': { width: 108, height: 40 },
  'packaging-summary': { width: 168, height: 64 },
};

export const nodeTypes = { cargo: CargoFlowNode };

export const defaultEdgeOptions = {
  type: 'smoothstep' as const,
  style: { stroke: '#475569', strokeWidth: 1.25 },
};
