import { memo } from "react";
import BaseNode from "./BaseNode.jsx";

function PrimaryHWNode(props) {
  return <BaseNode {...props} color="#ef4444" />;
}

const MemoizedPrimaryHWNode = memo(PrimaryHWNode);
MemoizedPrimaryHWNode.size = { width: 266, height: 154 };

export default MemoizedPrimaryHWNode;
