import type { CargoNodeData } from '@/features/cargo-flow/cargoNode.types';
import { CargoFlowNode } from '@/features/cargo-flow/CargoFlowNode';

export const MAX_GOODS_PER_NODE = 2;

export const NODE_SIZE: Record<CargoNodeData['kind'], { width: number; height: number }> = {
  transport: { width: 148, height: 46 },
  packaging: { width: 158, height: 62 },
  goods: { width: 132, height: 52 },
  'goods-summary': { width: 108, height: 40 },
};

export const nodeTypes = { cargo: CargoFlowNode };

export const defaultEdgeOptions = {
  type: 'smoothstep' as const,
  style: { stroke: '#475569', strokeWidth: 1.25 },
};
