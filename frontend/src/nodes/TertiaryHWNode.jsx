import { memo } from "react";
import BaseNode from "./BaseNode.jsx";

function TertiaryHWNode(props) {
  return <BaseNode {...props} color="#fbbf24" />;
}

const MemoizedTertiaryHWNode = memo(TertiaryHWNode);
MemoizedTertiaryHWNode.size = { width: 189, height: 105 };

export default MemoizedTertiaryHWNode;
