import { memo } from "react";
import BaseNode from "./BaseNode.jsx";

function SensorNode(props) {
  return <BaseNode {...props} color="#22c55e" />;
}

const MemoizedSensorNode = memo(SensorNode);
MemoizedSensorNode.size = { width: 133, height: 84 };

export default MemoizedSensorNode;
