import { memo } from "react";
import BaseNode from "./BaseNode.jsx";

function PrimaryCHWNode(props) {
  return <BaseNode {...props} color="#3b82f6" />;
}

const MemoizedPrimaryCHWNode = memo(PrimaryCHWNode);
MemoizedPrimaryCHWNode.size = { width: 266, height: 154 };

export default MemoizedPrimaryCHWNode;
