import { memo } from "react";
import BaseNode from "./BaseNode.jsx";

function TertiaryCHWNode(props) {
  return <BaseNode {...props} color="#0ea5e9" />;
}

const MemoizedTertiaryCHWNode = memo(TertiaryCHWNode);
MemoizedTertiaryCHWNode.size = { width: 189, height: 105 };

export default MemoizedTertiaryCHWNode;
