import { memo } from "react";
import BaseNode from "./BaseNode.jsx";

function SecondaryHWNode(props) {
  return <BaseNode {...props} color="#f97316" />;
}

const MemoizedSecondaryHWNode = memo(SecondaryHWNode);
MemoizedSecondaryHWNode.size = { width: 224, height: 126 };

export default MemoizedSecondaryHWNode;
