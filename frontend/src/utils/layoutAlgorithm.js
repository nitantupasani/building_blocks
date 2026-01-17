// Auto-layout algorithm for hierarchical tree structure
export function calculateTreeLayout(nodes, edges) {
  // Build adjacency list (parent -> children) and parents map (child -> parents[])
  const children = {};
  const parents = {};

  edges.forEach(edge => {
    const parent = edge.source;
    const child = edge.target;
    if (!children[parent]) children[parent] = [];
    if (!children[parent].includes(child)) children[parent].push(child);
    if (!parents[child]) parents[child] = [];
    if (!parents[child].includes(parent)) parents[child].push(parent);
  });

  const roots = nodes.filter(n => !parents[n.id] || parents[n.id].length === 0).map(n => n.id);

  // If no roots found, fallback to a simple row layout
  if (roots.length === 0) {
    return nodes.map((node, index) => ({ ...node, position: { x: index * 250, y: 50 } }));
  }

  const SCALE = 1.4;
  const getNodeSize = (type) => {
    const base = {
      building: { width: 240, height: 140 },
      'primary-hw': { width: 190, height: 110 },
      'primary-chw': { width: 190, height: 110 },
      'secondary-hw': { width: 160, height: 90 },
      'secondary-chw': { width: 160, height: 90 },
      'tertiary-hw': { width: 135, height: 75 },
      'tertiary-chw': { width: 135, height: 75 },
      sensor: { width: 95, height: 60 }
    };
    const s = base[type] || { width: 150, height: 100 };
    return { width: Math.round(s.width * SCALE), height: Math.round(s.height * SCALE) };
  };

  const HORIZONTAL_SPACING = Math.round(80 * SCALE);
  const VERTICAL_SPACING = Math.round(120 * SCALE);

  const calculateSubtreeWidth = (nodeId, memo = {}) => {
    if (memo[nodeId] !== undefined) return memo[nodeId];
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return 0;
    const nodeWidth = getNodeSize(node.type).width;
    const nodeChildren = children[nodeId] || [];
    if (nodeChildren.length === 0) return memo[nodeId] = nodeWidth;
    const childrenWidth = nodeChildren.reduce((sum, cid) => sum + calculateSubtreeWidth(cid, memo), 0);
    const totalChildrenWidth = childrenWidth + (nodeChildren.length - 1) * HORIZONTAL_SPACING;
    memo[nodeId] = Math.max(nodeWidth, totalChildrenWidth);
    return memo[nodeId];
  };

  // Pre-calc heights per (logical) level
  const levelHeights = {};
  const recordLevelHeights = (nodeId, level = 0) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const nodeSize = getNodeSize(node.type);
    levelHeights[level] = Math.max(levelHeights[level] || 0, nodeSize.height);
    (children[nodeId] || []).forEach(childId => {
      const child = nodes.find(n => n.id === childId) || {};
      const nextLevel = level + (/tertiary/i.test(String(child.type || '')) ? 2 : 1);
      recordLevelHeights(childId, nextLevel);
    });
  };

  roots.forEach(r => recordLevelHeights(r));

  const positioned = {};
  const positionSubtree = (nodeId, x, y, level = 0) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || positioned[nodeId]) return;
    const nodeSize = getNodeSize(node.type);
    const levelHeight = levelHeights[level] || nodeSize.height;
    positioned[nodeId] = { x: x - nodeSize.width / 2, y };
    const nodeChildren = children[nodeId] || [];
    if (nodeChildren.length === 0) return;
    const childWidths = nodeChildren.map(cid => calculateSubtreeWidth(cid));
    const totalWidth = childWidths.reduce((s, w) => s + w, 0) + (nodeChildren.length - 1) * HORIZONTAL_SPACING;
    let childX = x - totalWidth / 2;
    nodeChildren.forEach((childId, idx) => {
      const childWidth = childWidths[idx];
      const childCenterX = childX + childWidth / 2;
      const childNode = nodes.find(n => n.id === childId) || {};
      const isTertiary = /tertiary/i.test(String(childNode.type || ''));
      const extraVertical = isTertiary ? Math.round(VERTICAL_SPACING * 2.0) : 0;
      positionSubtree(childId, childCenterX, y + levelHeight + VERTICAL_SPACING + extraVertical, level + (isTertiary ? 2 : 1));
      childX += childWidth + HORIZONTAL_SPACING;
    });
  };

  let currentX = 300;
  roots.forEach(rootId => {
    const rootWidth = calculateSubtreeWidth(rootId);
    positionSubtree(rootId, currentX, 50, 0);
    currentX += rootWidth + HORIZONTAL_SPACING * 3;
  });

  // Post-process: ensure tertiary nodes sit below secondary siblings
  nodes.forEach(node => {
    if (!/tertiary/i.test(String(node.type || ''))) return;
    const myPos = positioned[node.id];
    if (!myPos) return;
    const parentIds = parents[node.id] || [];
    let maxSiblingBottom = -Infinity;
    parentIds.forEach(pid => {
      (children[pid] || []).forEach(sid => {
        const sibling = nodes.find(n => n.id === sid);
        if (!sibling) return;
        if (/secondary/i.test(String(sibling.type || '')) && positioned[sid]) {
          const sibPos = positioned[sid];
          const sibBottom = sibPos.y + getNodeSize(sibling.type).height;
          maxSiblingBottom = Math.max(maxSiblingBottom, sibBottom);
        }
      });
    });
    if (maxSiblingBottom !== -Infinity) {
      const targetY = maxSiblingBottom + Math.round(VERTICAL_SPACING / 2);
      if (myPos.y < targetY) positioned[node.id] = { x: myPos.x, y: targetY };
    }
  });

  // Align tertiary nodes horizontally per root ancestor (group tertiaries and set same Y)
  const findRootForNode = (startId) => {
    const q = (parents[startId] || []).slice();
    const seen = new Set();
    while (q.length) {
      const p = q.shift();
      if (seen.has(p)) continue;
      seen.add(p);
      if (!parents[p] || parents[p].length === 0 || roots.includes(p)) return p;
      q.push(...(parents[p] || []));
    }
    return roots[0] || null;
  };

  const tertiariesByRoot = {};
  nodes.forEach(n => {
    if (/tertiary/i.test(String(n.type || '')) && positioned[n.id]) {
      const rootId = findRootForNode(n.id) || 'default';
      tertiariesByRoot[rootId] = tertiariesByRoot[rootId] || [];
      tertiariesByRoot[rootId].push(n.id);
    }
  });

  Object.values(tertiariesByRoot).forEach(group => {
    if (group.length <= 1) return;
    const maxY = group.reduce((m, id) => Math.max(m, positioned[id].y || 0), -Infinity);
    group.forEach(id => {
      const p = positioned[id];
      if (p && p.y < maxY) positioned[id] = { x: p.x, y: maxY };
    });
  });

  return nodes.map(node => ({
    ...node,
    position: positioned[node.id] || node.position || { x: 0, y: 0 }
  }));
}
