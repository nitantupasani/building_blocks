import { memo } from "react";
import BaseNode from "./BaseNode.jsx";

export const PROPERTIES = [
  { key: "sensorType", label: "Type", type: "text", placeholder: "Temperature, Pressure, etc." },
  { key: "unit", label: "Unit", type: "text", placeholder: "°F, PSI, etc." },
  { key: "range", label: "Range", type: "text", placeholder: "0-100" },
  { key: "location", label: "Location", type: "text", placeholder: "Sensor location" },
];

function SensorNode(props) {
  return <BaseNode {...props} color="#22c55e" />;
}

const MemoizedSensorNode = memo(SensorNode);
MemoizedSensorNode.size = { width: 133, height: 84 };

export default MemoizedSensorNode;
