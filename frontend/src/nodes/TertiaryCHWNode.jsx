import { memo } from "react";
import BaseNode from "./BaseNode.jsx";

const PROPERTIES = [
  { key: "sensors_count", label: "Sensors Count", type: "number", placeholder: "0" },
  { key: "equipment", label: "Equipment", type: "text", placeholder: "Equipment" },
  { key: "sensors", label: "Sensors", type: "list" },
  { key: "flowRate", label: "Flow Rate (GPM)", type: "number", placeholder: "Flow rate" },
  { key: "supplyTemp", label: "Supply Temp (°F)", type: "number", placeholder: "Supply temp" },
  { key: "returnTemp", label: "Return Temp (°F)", type: "number", placeholder: "Return temp" },
  { key: "description", label: "Description", type: "textarea", placeholder: "Loop details..." },
];

function TertiaryCHWNode(props) {
  return <BaseNode {...props} color="#0ea5e9" properties={PROPERTIES} />;
}

const MemoizedTertiaryCHWNode = memo(TertiaryCHWNode);
MemoizedTertiaryCHWNode.size = { width: 135, height: 75 };

export default MemoizedTertiaryCHWNode;
