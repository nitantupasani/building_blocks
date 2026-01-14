// Auto-layout algorithm for hierarchical tree structure
export function calculateTreeLayout(nodes, edges) {
  // Build adjacency list (parent -> children)
  const children = {};
  const parents = {};
  
  edges.forEach(edge => {
    const parent = edge.source;
    const child = edge.target;
    
    if (!children[parent]) children[parent] = [];
    children[parent].push(child);
    parents[child] = parent;
  });

  // Find root nodes (nodes with no parent)
  const roots = nodes.filter(node => !parents[node.id]).map(n => n.id);

  // If no roots found, treat all disconnected nodes as roots
  if (roots.length === 0) {
    return nodes.map((node, index) => ({
      ...node,
      position: { x: index * 250, y: 50 }
    }));
  }

  // Node dimensions by type
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

  // Layout configuration
  const HORIZONTAL_SPACING = 80;
  const VERTICAL_SPACING = 120;

  // Calculate subtree width (for centering)
  const calculateSubtreeWidth = (nodeId, memo = {}) => {
    if (memo[nodeId] !== undefined) return memo[nodeId];
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return 0;

    const nodeWidth = getNodeSize(node.type).width;
    const nodeChildren = children[nodeId] || [];
    
    if (nodeChildren.length === 0) {
      memo[nodeId] = nodeWidth;
      return nodeWidth;
    }

    const childrenWidth = nodeChildren.reduce((sum, childId) => {
      return sum + calculateSubtreeWidth(childId, memo);
    }, 0);
    
    const totalChildrenWidth = childrenWidth + (nodeChildren.length - 1) * HORIZONTAL_SPACING;
    memo[nodeId] = Math.max(nodeWidth, totalChildrenWidth);
    
    return memo[nodeId];
  };

  // Position nodes using DFS
  const positioned = {};
  const levels = {};

  const positionSubtree = (nodeId, x, y, level = 0) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || positioned[nodeId]) return;

    const nodeSize = getNodeSize(node.type);
    levels[level] = Math.max(levels[level] || 0, nodeSize.height);

    // Position current node centered at x
    positioned[nodeId] = {
      x: x - nodeSize.width / 2,
      y
    };

    // Position children
    const nodeChildren = children[nodeId] || [];
    if (nodeChildren.length === 0) return;

    // Calculate total width needed for children
    const childWidths = nodeChildren.map(childId => calculateSubtreeWidth(childId));
    const totalWidth = childWidths.reduce((sum, w) => sum + w, 0) + 
                       (nodeChildren.length - 1) * HORIZONTAL_SPACING;

    // Start position for first child (centered under parent)
    let childX = x - totalWidth / 2;

    // Position each child
    nodeChildren.forEach((childId, index) => {
      const childWidth = childWidths[index];
      const childCenterX = childX + childWidth / 2;
      
      positionSubtree(
        childId, 
        childCenterX, 
        y + levels[level] + VERTICAL_SPACING,
        level + 1
      );
      
      childX += childWidth + HORIZONTAL_SPACING;
    });
  };

  // Position each root tree
  let currentX = 300;
  roots.forEach(rootId => {
    const rootWidth = calculateSubtreeWidth(rootId);
    positionSubtree(rootId, currentX, 50, 0);
    currentX += rootWidth + HORIZONTAL_SPACING * 3;
  });

  // Return nodes with calculated positions (or keep existing if already positioned)
  return nodes.map(node => ({
    ...node,
    position: positioned[node.id] || node.position || { x: 0, y: 0 }
  }));
}
