const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Helper function to handle API errors
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP error ${response.status}`);
  }
  return response.json();
};

// Graph operations
export const api = {
  // Get entire graph
  async getGraph() {
    const response = await fetch(`${API_BASE_URL}/api/graph`);
    return handleResponse(response);
  },

  // Update entire graph
  async updateGraph(nodes, edges) {
    const response = await fetch(`${API_BASE_URL}/api/graph`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes, edges })
    });
    return handleResponse(response);
  },

  // Node operations
  async createNode(node) {
    const response = await fetch(`${API_BASE_URL}/api/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(node)
    });
    return handleResponse(response);
  },

  async updateNode(nodeId, updates) {
    const response = await fetch(`${API_BASE_URL}/api/nodes/${nodeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return handleResponse(response);
  },

  async deleteNode(nodeId) {
    const response = await fetch(`${API_BASE_URL}/api/nodes/${nodeId}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  },

  // Edge operations
  async createEdge(edge) {
    const response = await fetch(`${API_BASE_URL}/api/edges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(edge)
    });
    return handleResponse(response);
  },

  async deleteEdge(edgeId) {
    const response = await fetch(`${API_BASE_URL}/api/edges/${edgeId}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  },

  // Get tree structure
  async getTreeStructure() {
    const response = await fetch(`${API_BASE_URL}/api/tree`);
    return handleResponse(response);
  }
};

// Transform backend format to React Flow format
export const transformToReactFlow = (backendData) => {
  const nodes = backendData.nodes.map(node => ({
    id: node.id,
    type: node.type,
    position: node.position || { x: 0, y: 0 },
    data: {
      label: node.properties.label || node.type,
      isExpanded: false,
      blockType: node.type,
      ...node.properties
    },
    style: getNodeSize(node.type)
  }));

  const edges = backendData.edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    type: 'default',
    animated: true,
    deletable: true
  }));

  return { nodes, edges };
};

// Transform React Flow format to backend format
export const transformToBackend = (nodes, edges) => {
  const backendNodes = nodes.map(node => ({
    id: node.id,
    type: node.type,
    position: node.position,
    properties: {
      label: node.data.label,
      ...Object.fromEntries(
        Object.entries(node.data).filter(([key]) => 
          !['isEditing', 'isExpanded', 'blockType', 'selected', 
            'onChangeLabel', 'onFinishEdit', 'onToggleExpand', 'onPropertyChange'].includes(key)
        )
      )
    }
  }));

  const backendEdges = edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle
  }));

  return { nodes: backendNodes, edges: backendEdges };
};

// Helper to get node size
const getNodeSize = (type) => {
  const sizes = {
    building: { width: 240, height: 140 },
    'primary-hw': { width: 190, height: 110 },
    'primary-chw': { width: 190, height: 110 },
    'secondary-hw': { width: 160, height: 90 },
    'secondary-chw': { width: 160, height: 90 },
    'tertiary-hw': { width: 135, height: 75 },
    'tertiary-chw': { width: 135, height: 75 },
    sensor: { width: 95, height: 60 }
  };
  return sizes[type] || { width: 150, height: 100 };
};
