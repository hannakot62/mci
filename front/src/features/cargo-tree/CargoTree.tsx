import React, { useCallback, useEffect, useMemo } from 'react';
import {
  Background,
  Controls,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import type { TransportDetail } from '@/api/client';
import type { MciLegendEntry } from '@/features/mci/MciLegend';
import { MciLegend } from '@/features/mci/MciLegend';
import { buildFlowElements } from './buildFlowElements';
import { defaultEdgeOptions, nodeTypes } from './cargoTree.constants';

interface CargoTreeProps {
  transport: TransportDetail | null;
}

export function CargoTree({ transport }: CargoTreeProps): React.ReactElement {
  const elements = useMemo(
    () =>
      transport
        ? buildFlowElements(transport)
        : { nodes: [], edges: [], legend: [] as MciLegendEntry[] },
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
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.12, maxZoom: 1.1 }}
        minZoom={0.12}
        maxZoom={1.4}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll
        zoomOnScroll
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} size={1} color="#1a2438" />
        <Controls showInteractive={false} />
      </ReactFlow>
      <MciLegend entries={elements.legend} />
    </div>
  );
}
