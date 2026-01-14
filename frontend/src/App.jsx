import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import PrimaryHWNode from "./nodes/PrimaryHWNode.jsx";
import PrimaryCHWNode from "./nodes/PrimaryCHWNode.jsx";
import SecondaryHWNode from "./nodes/SecondaryHWNode.jsx";
import SecondaryCHWNode from "./nodes/SecondaryCHWNode.jsx";
import TertiaryHWNode from "./nodes/TertiaryHWNode.jsx";
import TertiaryCHWNode from "./nodes/TertiaryCHWNode.jsx";
import SensorNode from "./nodes/SensorNode.jsx";
import { api, transformToReactFlow, transformToBackend } from "./api/graphApi.js";
import { calculateTreeLayout } from "./utils/layoutAlgorithm.js";
import "./App.css";

const nodeTypes = {
  building: BuildingNode,
  "primary-hw": PrimaryHWNode,
  "primary-chw": PrimaryCHWNode,
  "secondary-hw": SecondaryHWNode,
  "secondary-chw": SecondaryCHWNode,
  "tertiary-hw": TertiaryHWNode,
  "tertiary-chw": TertiaryCHWNode,
  sensor: SensorNode,
};

// Helper function to get size for a block type
const getBlockSize = (blockType) => {
  const nodeComponent = nodeTypes[blockType];
  return nodeComponent?.size || { width: 150, height: 100 };
};

const DEFAULT_NODE_SIZE = BuildingNode.size;
const NEW_BLOCK_SIZE = BuildingNode.size;

const initialNodes = [
  {
    id: "1",
    type: "building",
    position: { x: 120, y: 80 },
    data: {
      label: "Building",
      isExpanded: false,
      blockType: "building",
    },
    style: { ...DEFAULT_NODE_SIZE },
  },
];

const rectsOverlap = (a, b) =>
  a.x < b.x + b.w &&
  a.x + a.w > b.x &&
  a.y < b.y + b.h &&
  a.y + a.h > b.y;

const findNonOverlappingTopLeft = (desiredTopLeft, size, existingNodes) => {
  const W = size.width;
  const H = size.height;
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
  const blockCountRef = useRef(1);
  const wrapperRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [editingNodeId, setEditingNodeId] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const nodeTypesMemo = useMemo(() => nodeTypes, []);

  // Load graph from backend on mount
  useEffect(() => {
    const loadGraph = async () => {
      try {
        const data = await api.getGraph();
        const { nodes: loadedNodes, edges: loadedEdges } = transformToReactFlow(data);
        
        // Apply auto-layout for nodes without positions
        const needsLayout = loadedNodes.some(n => !n.position || (n.position.x === 0 && n.position.y === 0));
        
        if (needsLayout && loadedNodes.length > 0) {
          const layoutedNodes = calculateTreeLayout(loadedNodes, loadedEdges);
          setNodes(layoutedNodes);
        } else {
          setNodes(loadedNodes);
        }
        
        setEdges(loadedEdges);
        
        // Update ID counter to avoid conflicts
        if (loadedNodes.length > 0) {
          const maxId = Math.max(...loadedNodes.map(n => parseInt(n.id) || 0));
          idRef.current = maxId + 1;
        }
      } catch (error) {
        console.error('Failed to load graph:', error);
        // Start with empty graph if backend is not available
      } finally {
        setLoading(false);
      }
    };

    loadGraph();
  }, [setNodes, setEdges]);

  // Auto-save to backend with debouncing
  const saveToBackend = useCallback((nodesToSave, edgesToSave) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const backendData = transformToBackend(nodesToSave, edgesToSave);
        await api.updateGraph(backendData.nodes, backendData.edges);
        console.log('Graph saved to backend');
      } catch (error) {
        console.error('Failed to save graph:', error);
      }
    }, 1000); // Debounce: save 1 second after last change
  }, []);

  // Save when nodes or edges change
  useEffect(() => {
    if (!loading && nodes.length >= 0) {
      saveToBackend(nodes, edges);
    }
  }, [nodes, edges, loading, saveToBackend]);

  // Handle YAML file selection
  const handleFileChange = useCallback((event) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  }, []);

  // Upload YAML and load graph
  const handleUploadYAML = useCallback(async () => {
    if (!uploadedFile) {
      alert('Please select a YAML file first');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const response = await fetch('http://localhost:8000/api/import/yaml', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('YAML uploaded:', result);
      
      // Reload graph from backend
      const data = await api.getGraph();
      const { nodes: loadedNodes, edges: loadedEdges } = transformToReactFlow(data);
      
      // Apply auto-layout
      const layoutedNodes = calculateTreeLayout(loadedNodes, loadedEdges);
      setNodes(layoutedNodes);
      setEdges(loadedEdges);
      
      // Update ID counter
      if (loadedNodes.length > 0) {
        const maxId = Math.max(...loadedNodes.map(n => parseInt(n.id) || 0));
        idRef.current = maxId + 1;
      }

      // Fit view to show all nodes
      setTimeout(() => {
        reactFlow.fitView?.({ padding: 0.2, includeHiddenNodes: true });
      }, 100);

      alert(`Success! Loaded ${result.nodes_count} nodes and ${result.edges_count} edges`);
      
      // Clear the file input so user can select the same or different file again
      const fileInput = document.getElementById('yaml-upload');
      if (fileInput) fileInput.value = '';
      setUploadedFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Failed to upload YAML: ${error.message}`);
    } finally {
      setUploading(false);
    }
  }, [uploadedFile, setNodes, setEdges, reactFlow]);

  // Draw graph - reapply layout to current graph
  const handleDrawGraph = useCallback(() => {
    if (nodes.length === 0) {
      alert('No nodes to draw. Please upload a YAML file first.');
      return;
    }

    // Reapply auto-layout
    const layoutedNodes = calculateTreeLayout(nodes, edges);
    setNodes(layoutedNodes);

    // Fit view
    setTimeout(() => {
      reactFlow.fitView?.({ padding: 0.2, includeHiddenNodes: true });
    }, 100);
  }, [nodes, edges, setNodes, reactFlow]);

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

  const toggleNodeExpand = useCallback(
    (id) => {
      setNodes((prev) =>
        prev.map((node) => {
          if (node.id !== id) return node;
          
          const isExpanded = !node.data.isExpanded;
          const blockSize = getBlockSize(node.data.blockType);
          const newHeight = isExpanded ? blockSize.height * 2.5 : blockSize.height;
          
          return {
            ...node,
            data: {
              ...node.data,
              isExpanded,
            },
            style: {
              ...node.style,
              height: newHeight,
            },
          };
        })
      );
    },
    [setNodes]
  );

  const updateNodeProperty = useCallback(
    (id, property, value) => {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  [property]: value,
                },
              }
            : node
        )
      );
    },
    [setNodes]
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const changeBlockType = useCallback(
    (nodeId, blockType) => {
      const newSize = getBlockSize(blockType);

      setNodes((prev) =>
        prev.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                type: blockType,
                data: {
                  ...node.data,
                  blockType,
                },
                style: {
                  ...node.style,
                  width: newSize.width,
                  height: node.data.isExpanded ? newSize.height * 2.5 : newSize.height,
                },
              }
            : node
        )
      );
      closeContextMenu();
    },
    [closeContextMenu, setNodes]
  );

  const deleteNode = useCallback(
    (nodeId) => {
      setNodes((prev) => prev.filter((node) => node.id !== nodeId));
      setEdges((prev) =>
        prev.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      );
      setEditingNodeId((prev) => (prev === nodeId ? null : prev));
      closeContextMenu();
    },
    [closeContextMenu, setEdges, setNodes]
  );

  const onEdgesDelete = useCallback(
    (deletedEdges) => {
      setEdges((eds) =>
        eds.filter((edge) => !deletedEdges.find((de) => de.id === edge.id))
      );
    },
    [setEdges]
  );

  const createNodeAtPosition = useCallback(
    (position, blockType = "building") => {
      const blockNumber = idRef.current;
      const id = String(idRef.current++);
      const nextBlockNumber = blockCountRef.current++;

      const blockLabels = {
        building: "Building",
        "primary-hw": "Primary HW Loop",
        "primary-chw": "Primary CHW Loop",
        "secondary-hw": "Secondary HW Loop",
        "secondary-chw": "Secondary CHW Loop",
        "tertiary-hw": "Tertiary HW Loop",
        "tertiary-chw": "Tertiary CHW Loop",
        sensor: "Sensor",
      };

      const blockSize = getBlockSize(blockType);

      setNodes((prev) => {
        // Convert desired "center" to top-left for the node
        const desiredTopLeft = {
          x: position.x - blockSize.width / 2,
          y: position.y - blockSize.height / 2,
        };

        // Find a free spot so we don't overlap existing nodes
        const placedTopLeft = findNonOverlappingTopLeft(
          desiredTopLeft,
          blockSize,
          prev
        );

        const newNode = {
          id,
          type: blockType,
          position: placedTopLeft,
          data: {
            label: blockLabels[blockType] || "Block",
            isExpanded: false,
            blockType,
          },
          style: { ...blockSize },
        };

        return [...prev, newNode];
      });

      // Optional: ensure it's in view
      requestAnimationFrame(() => {
        reactFlow.fitView?.({ padding: 0.2, includeHiddenNodes: true });
      });
    },
    [reactFlow, setNodes]
  );

  const addBlockAtCenter = useCallback((blockType = "building") => {
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
      createNodeAtPosition({ x: 0, y: 0 }, blockType);
      return;
    }

    createNodeAtPosition(centerFlow, blockType);
  }, [createNodeAtPosition, reactFlow]);

  // Your ReactFlow version didn't support onPaneDoubleClick; use click detail
  const onPaneClick = useCallback(
    (event) => {
      closeContextMenu();
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
    [closeContextMenu, createNodeAtPosition, reactFlow]
  );

  const onNodeDoubleClick = useCallback((_, node) => {
    closeContextMenu();
    setEditingNodeId(node.id);
  }, [closeContextMenu]);

  const onNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();

      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      setNodes((prev) =>
        prev.map((item) => ({
          ...item,
          selected: item.id === node.id,
        }))
      );

      setContextMenu({
        nodeId: node.id,
        position: { x, y },
      });
    },
    [setNodes]
  );

  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onReconnect = useCallback(
    (oldEdge, newConnection) => {
      setEdges((eds) => {
        const filtered = eds.filter((edge) => edge.id !== oldEdge.id);
        return addEdge(newConnection, filtered);
      });
    },
    [setEdges]
  );

  const nodesWithHandlers = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isEditing: editingNodeId === node.id,
          selected: node.selected,
          onChangeLabel: updateNodeLabel,
          onFinishEdit: finishEditing,
          onToggleExpand: toggleNodeExpand,
          onPropertyChange: updateNodeProperty,
        },
      })),
    [editingNodeId, finishEditing, nodes, updateNodeLabel, toggleNodeExpand, updateNodeProperty]
  );

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__header-content">
          <h1>Building Blocks Editor</h1>
          <p>
            Use the Add block button or double-click the canvas to add a block.
            Double-click a block to edit its label. Use the side handles to connect nodes.
            {loading && " Loading..."}
          </p>
        </div>
      </header>

      <main className="app__canvas" ref={wrapperRef}>
        <div className="app__yaml-controls">
          <div className="app__yaml-upload">
            <input
              type="file"
              accept=".yaml,.yml"
              onChange={handleFileChange}
              id="yaml-upload"
              className="app__file-input"
            />
            <label htmlFor="yaml-upload" className="app__file-label">
              {uploadedFile ? uploadedFile.name : 'Choose YAML'}
            </label>
          </div>
          <button
            className="app__yaml-button app__yaml-button--upload"
            onClick={handleUploadYAML}
            disabled={!uploadedFile || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
          <button
            className="app__yaml-button app__yaml-button--draw"
            onClick={handleDrawGraph}
            disabled={nodes.length === 0}
          >
            Draw Graph
          </button>
        </div>
        <div className="app__add-buttons">
          <button
            className="app__add-button app__add-button--primary-hw"
            type="button"
            onClick={() => addBlockAtCenter("primary-hw")}
          >
            + Primary HW
          </button>
          <button
            className="app__add-button app__add-button--primary-chw"
            type="button"
            onClick={() => addBlockAtCenter("primary-chw")}
          >
            + Primary CHW
          </button>
          <button
            className="app__add-button app__add-button--secondary-hw"
            type="button"
            onClick={() => addBlockAtCenter("secondary-hw")}
          >
            + Secondary HW
          </button>
          <button
            className="app__add-button app__add-button--secondary-chw"
            type="button"
            onClick={() => addBlockAtCenter("secondary-chw")}
          >
            + Secondary CHW
          </button>
          <button
            className="app__add-button app__add-button--tertiary-hw"
            type="button"
            onClick={() => addBlockAtCenter("tertiary-hw")}
          >
            + Tertiary HW
          </button>
          <button
            className="app__add-button app__add-button--tertiary-chw"
            type="button"
            onClick={() => addBlockAtCenter("tertiary-chw")}
          >
            + Tertiary CHW
          </button>
          <button
            className="app__add-button app__add-button--sensor"
            type="button"
            onClick={() => addBlockAtCenter("sensor")}
          >
            + Sensor
          </button>
        </div>
        <ReactFlow
          nodes={nodesWithHandlers}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onReconnect={onReconnect}
          onEdgesDelete={onEdgesDelete}
          nodeTypes={nodeTypesMemo}
          onPaneClick={onPaneClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onNodeContextMenu={onNodeContextMenu}
          connectionMode="loose"
          defaultEdgeOptions={{
            type: 'default',
            animated: true,
            deletable: true,
          }}
          elementsSelectable={true}
          reconnectRadius={20}
          deleteKeyCode={['Backspace', 'Delete']}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background gap={24} size={1} color="#e6e8eb" />
          <MiniMap pannable zoomable className="app__minimap" />
          <Controls />
        </ReactFlow>
        {contextMenu ? (
          <div
            className="app__context-menu"
            style={{
              left: contextMenu.position.x,
              top: contextMenu.position.y,
            }}
          >
            <div className="app__context-menu-section">
              <div className="app__context-menu-label">Change Type</div>
              <button
                type="button"
                className="app__context-menu-item"
                onClick={() => changeBlockType(contextMenu.nodeId, "building")}
              >
                Building
              </button>
              <button
                type="button"
                className="app__context-menu-item"
                onClick={() => changeBlockType(contextMenu.nodeId, "primary-hw")}
              >
                Primary HW Loop
              </button>
              <button
                type="button"
                className="app__context-menu-item"
                onClick={() => changeBlockType(contextMenu.nodeId, "primary-chw")}
              >
                Primary CHW Loop
              </button>
              <button
                type="button"
                className="app__context-menu-item"
                onClick={() => changeBlockType(contextMenu.nodeId, "secondary-hw")}
              >
                Secondary HW Loop
              </button>
              <button
                type="button"
                className="app__context-menu-item"
                onClick={() => changeBlockType(contextMenu.nodeId, "secondary-chw")}
              >
                Secondary CHW Loop
              </button>
              <button
                type="button"
                className="app__context-menu-item"
                onClick={() => changeBlockType(contextMenu.nodeId, "tertiary-hw")}
              >
                Tertiary HW Loop
              </button>
              <button
                type="button"
                className="app__context-menu-item"
                onClick={() => changeBlockType(contextMenu.nodeId, "tertiary-chw")}
              >
                Tertiary CHW Loop
              </button>
              <button
                type="button"
                className="app__context-menu-item"
                onClick={() => changeBlockType(contextMenu.nodeId, "sensor")}
              >
                Sensor
              </button>
            </div>
            <div className="app__context-menu-divider"></div>
            <button
              type="button"
              className="app__context-menu-item app__context-menu-item--delete"
              onClick={() => deleteNode(contextMenu.nodeId)}
            >
              Delete
            </button>
          </div>
        ) : null}
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
