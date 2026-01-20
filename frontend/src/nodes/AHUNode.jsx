import { memo } from "react";
import BaseNode from "./BaseNode.jsx";

function AHUNode(props) {
  // All AHU blocks should use a light green color for consistency
  const lightGreen = "#bbf7d0"; // soft light green
  return <BaseNode {...props} color={lightGreen} className="base-node--ahu" />;
}

const MemoizedAHUNode = memo(AHUNode);
MemoizedAHUNode.size = { width: 160, height: 90 };

export default MemoizedAHUNode;
