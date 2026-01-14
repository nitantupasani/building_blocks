import { useCallback, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import BuildingNode from "./nodes/BuildingNode.jsx";
import "./App.css";

const initialNodes = [
  {
    id: "1",
    type: "building",
    position: { x: 120, y: 80 },
    data: { label: "Building" },
    style: { width: 220, height: 130 },
  },
];

const nodeTypes = { building: BuildingNode };
const DEFAULT_NODE_SIZE = { width: 220, height: 130 };

function FlowCanvas() {
  const idRef = useRef(2);
  const wrapperRef = useRef(null);

  // ✅ store the RF instance from onInit (reliable)
  const rfRef = useRef(null);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [editingNodeId, setEditingNodeId] = useState(null);

  const nodeTypesMemo = useMemo(() => nodeTypes, []);

  const updateNodeLabel = useCallback(
    (id, nextLabel) => {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, label: nextLabel } }
            : node
        )
      );
    },
    [setNodes]
  );

  const finishEditing = useCallback(() => setEditingNodeId(null), []);

  const createNodeAtPosition = useCallback(
  (position) => {
    const id = String(idRef.current++);

    const newNode = {
      id,
      type: "default", // ✅ TEMP: bypass your custom BuildingNode
      position: {
        x: position.x,
        y: position.y,
      },
      data: { label: `Node ${id}` },
    };

    setNodes((prev) => [...prev, newNode]);
  },
  [setNodes]
);


  const addBlockAtCenter = useCallback(() => {
  // guaranteed visible for a first test
  createNodeAtPosition({ x: 0, y: 0 });

  // optional: zoom to include new node
  requestAnimationFrame(() => {
    rfRef.current?.fitView?.({ padding: 0.2 });
  });
}, [createNodeAtPosition]);


  const onPaneDoubleClick = useCallback(
    (event) => {
      event.preventDefault();
      if (!rfRef.current) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const screen = { x: event.clientX, y: event.clientY };

      const toFlow =
        rfRef.current.screenToFlowPosition ?? rfRef.current.project;

      // for older versions using project with local coords:
      const flowPos =
        rfRef.current.screenToFlowPosition
          ? toFlow(screen)
          : toFlow({ x: screen.x - rect.left, y: screen.y - rect.top });

      createNodeAtPosition(flowPos);
    },
    [createNodeAtPosition]
  );

  const onNodeDoubleClick = useCallback((_, node) => {
    setEditingNodeId(node.id);
  }, []);

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
        <div className="app__header-row">
          <div>
            <h1>Building Blocks Editor</h1>
            <p>
              Use the Add block button or double-click the canvas to add a block.
              Double-click a block to edit its label. Drag edges to resize.
            </p>
          </div>
          <button className="app__add-button" type="button" onClick={addBlockAtCenter}>
            Add block
          </button>
        </div>
      </header>

      <main className="app__canvas" ref={wrapperRef}>
        <ReactFlow
          onInit={(instance) => (rfRef.current = instance)}   // ✅ important
          nodes={nodesWithHandlers}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypesMemo}
          onPaneClick={(event) => {
          if (event.detail === 2) onPaneDoubleClick(event);
          }}

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
