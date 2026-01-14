import { useCallback, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
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

const nodeTypes = {
  building: BuildingNode,
};

const DEFAULT_NODE_SIZE = { width: 220, height: 130 };

function FlowCanvas() {
  const reactFlow = useReactFlow();
  const idRef = useRef(2);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [editingNodeId, setEditingNodeId] = useState(null);

  const nodeTypesMemo = useMemo(() => nodeTypes, []);

  const updateNodeLabel = useCallback((id, nextLabel) => {
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
  }, []);

  const finishEditing = useCallback(() => {
    setEditingNodeId(null);
  }, []);

  const createNodeAt = useCallback(
    (event) => {
      const bounds = event.currentTarget.getBoundingClientRect();
      const position = reactFlow.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
      const id = String(idRef.current++);
      const newNode = {
        id,
        type: "building",
        position: {
          x: position.x - DEFAULT_NODE_SIZE.width / 2,
          y: position.y - DEFAULT_NODE_SIZE.height / 2,
        },
        data: { label: "Building" },
        style: { ...DEFAULT_NODE_SIZE },
      };
      setNodes((prev) => [...prev, newNode]);
      setEditingNodeId(id);
    },
    [reactFlow]
  );

  const onPaneDoubleClick = useCallback(
    (event) => {
      event.preventDefault();
      createNodeAt(event);
    },
    [createNodeAt]
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
        <div>
          <h1>Building Blocks Editor</h1>
          <p>
            Double-click the canvas to add a block. Double-click a block to edit its
            label. Drag edges to resize.
          </p>
        </div>
      </header>
      <main className="app__canvas">
        <ReactFlow
          nodes={nodesWithHandlers}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypesMemo}
          onPaneDoubleClick={onPaneDoubleClick}
          onNodeDoubleClick={onNodeDoubleClick}
          panOnDrag
          panOnScroll
          zoomOnScroll
          zoomOnPinch
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
