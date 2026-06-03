import type { Edge, Node } from '@xyflow/react';
import type { MciLegendEntry } from '@/features/mci/MciLegend';

export type GraphMode = 'full' | 'overview';

export type FlowGraphResult = {
  nodes: Node[];
  edges: Edge[];
  legend: MciLegendEntry[];
  graphMode: GraphMode;
  packagingCount: number;
};
