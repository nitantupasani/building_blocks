import { useCallback, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
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
  const wrapperRef = useRef(null);
  const [nodes, setNodes] = useState(initialNodes);
  const [edges] = useState([]);
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

  const createNodeAtPosition = useCallback((position) => {
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
  }, []);

  const createNodeAt = useCallback(
    (event) => {
      const bounds = event.currentTarget.getBoundingClientRect();
      const position = reactFlow.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
      createNodeAtPosition(position);
    },
    [createNodeAtPosition, reactFlow]
  );

  const addBlockAtCenter = useCallback(() => {
    if (!wrapperRef.current) {
      return;
    }
    const bounds = wrapperRef.current.getBoundingClientRect();
    const position = reactFlow.project({
      x: bounds.width / 2,
      y: bounds.height / 2,
    });
    createNodeAtPosition(position);
  }, [createNodeAtPosition, reactFlow]);

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
          nodes={nodesWithHandlers}
          edges={edges}
          nodeTypes={nodeTypesMemo}
          onPaneDoubleClick={onPaneDoubleClick}
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
