import { memo } from "react";
import BaseNode from "./BaseNode.jsx";

function BuildingNode(props) {
  return <BaseNode {...props} color="#94a3b8" />;
}

const MemoizedBuildingNode = memo(BuildingNode);
MemoizedBuildingNode.size = { width: 336, height: 196 };

export default MemoizedBuildingNode;
