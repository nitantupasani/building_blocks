import { memo } from "react";
import BaseNode from "./BaseNode.jsx";

function SecondaryCHWNode(props) {
  return <BaseNode {...props} color="#06b6d4" />;
}

const MemoizedSecondaryCHWNode = memo(SecondaryCHWNode);
MemoizedSecondaryCHWNode.size = { width: 224, height: 126 };

export default MemoizedSecondaryCHWNode;
