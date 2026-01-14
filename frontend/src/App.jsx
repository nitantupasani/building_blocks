import { useCallback, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";

import BuildingNode from "./nodes/BuildingNode.jsx";
import "./App.css";

const DEFAULT_NODE_SIZE = { width: 140, height: 90 };

const initialNodes = [
  {
    id: "1",
    type: "building",
    position: { x: 120, y: 80 },
    data: { label: "Building" },
    style: { ...DEFAULT_NODE_SIZE },
  },
];

const nodeTypes = {
  building: BuildingNode,
};

const rectsOverlap = (a, b) =>
  a.x < b.x + b.w &&
  a.x + a.w > b.x &&
  a.y < b.y + b.h &&
  a.y + a.h > b.y;

const findNonOverlappingTopLeft = (desiredTopLeft, existingNodes) => {
  const W = DEFAULT_NODE_SIZE.width;
  const H = DEFAULT_NODE_SIZE.height;
  const padding = 24;

  const occupied = existingNodes.map((n) => ({
    x: n.position.x,
    y: n.position.y,
    w: Number(n.style?.width ?? W),
    h: Number(n.style?.height ?? H),
  }));

  const mkRect = (x, y) => ({ x, y, w: W, h: H });

  // Spiral search around desired position
  const radii = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  for (const r of radii) {
    const d = r * (W + padding);
    const candidates = [
      [0, 0],
      [d, 0],
      [-d, 0],
      [0, d],
      [0, -d],
      [d, d],
      [-d, d],
      [d, -d],
      [-d, -d],
    ];

    for (const [dx, dy] of candidates) {
      const x = desiredTopLeft.x + dx;
      const y = desiredTopLeft.y + dy;
      const cand = mkRect(x, y);

      const overlaps = occupied.some((o) => rectsOverlap(cand, o));
      if (!overlaps) return { x, y };
    }
  }

  return desiredTopLeft;
};

function FlowCanvas() {
  const reactFlow = useReactFlow();
  const idRef = useRef(2);
  const wrapperRef = useRef(null);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [editingNodeId, setEditingNodeId] = useState(null);

  const nodeTypesMemo = useMemo(() => nodeTypes, []);

  const updateNodeLabel = useCallback(
    (id, nextLabel) => {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  label: nextLabel,
                },
              }
            : node
        )
      );
    },
    [setNodes]
  );

  const finishEditing = useCallback(() => {
    setEditingNodeId(null);
  }, []);

  const createNodeAtPosition = useCallback(
    (position) => {
      const blockNumber = idRef.current;
      const id = String(idRef.current++);

      setNodes((prev) => {
        // Convert desired "center" to top-left for the node
        const desiredTopLeft = {
          x: position.x - DEFAULT_NODE_SIZE.width / 2,
          y: position.y - DEFAULT_NODE_SIZE.height / 2,
        };

        // Find a free spot so we don't overlap existing nodes
        const placedTopLeft = findNonOverlappingTopLeft(desiredTopLeft, prev);

        const newNode = {
          id,
          type: "building",
          position: placedTopLeft,
          data: { label: `Block ${blockNumber}` },
          style: { ...DEFAULT_NODE_SIZE },
        };

        return [...prev, newNode];
      });

      setEditingNodeId(id);

      // Optional: ensure it's in view
      requestAnimationFrame(() => {
        reactFlow.fitView?.({ padding: 0.2, includeHiddenNodes: true });
      });
    },
    [reactFlow, setNodes]
  );

  const addBlockAtCenter = useCallback(() => {
    if (!wrapperRef.current) return;

    const rect = wrapperRef.current.getBoundingClientRect();
    const centerScreen = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    // v11+: screenToFlowPosition, older: project
    const toFlow = reactFlow.screenToFlowPosition ?? reactFlow.project;
    const centerFlow = toFlow(centerScreen);

    if (!Number.isFinite(centerFlow.x) || !Number.isFinite(centerFlow.y)) {
      // fallback
      createNodeAtPosition({ x: 0, y: 0 });
      return;
    }

    createNodeAtPosition(centerFlow);
  }, [createNodeAtPosition, reactFlow]);

  // Your ReactFlow version didn't support onPaneDoubleClick; use click detail
  const onPaneClick = useCallback(
    (event) => {
      if (event.detail !== 2) return;

      event.preventDefault();
      if (!wrapperRef.current) return;

      const rect = wrapperRef.current.getBoundingClientRect();
      const screen = { x: event.clientX, y: event.clientY };

      const toFlow = reactFlow.screenToFlowPosition ?? reactFlow.project;

      // If we have screenToFlowPosition, it expects absolute screen coords.
      // If we only have project, it expects coords relative to the ReactFlow container.
      const flowPos =
        reactFlow.screenToFlowPosition
          ? toFlow(screen)
          : toFlow({ x: screen.x - rect.left, y: screen.y - rect.top });

      createNodeAtPosition(flowPos);
    },
    [createNodeAtPosition, reactFlow]
  );

  const onNodeDoubleClick = useCallback((_, node) => {
    setEditingNodeId(node.id);
  }, []);

  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const nodesWithHandlers = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isEditing: editingNodeId === node.id,
          onChangeLabel: updateNodeLabel,
          onFinishEdit: finishEditing,
        },
      })),
    [editingNodeId, finishEditing, nodes, updateNodeLabel]
  );

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__header-content">
          <h1>Building Blocks Editor</h1>
          <p>
            Use the Add block button or double-click the canvas to add a block.
            Double-click a block to edit its label. Use the side handles to connect nodes.
          </p>
        </div>
      </header>

      <main className="app__canvas" ref={wrapperRef}>
        <button className="app__add-button" type="button" onClick={addBlockAtCenter}>
          Add block
        </button>
        <ReactFlow
          nodes={nodesWithHandlers}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypesMemo}
          onPaneClick={onPaneClick}
          onNodeDoubleClick={onNodeDoubleClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background gap={24} size={1} color="#e6e8eb" />
          <MiniMap pannable zoomable className="app__minimap" />
          <Controls />
        </ReactFlow>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}