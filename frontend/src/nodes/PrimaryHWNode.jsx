import { memo } from "react";
import BaseNode from "./BaseNode.jsx";

export const PROPERTIES = [
  { key: "flowRate", label: "Flow Rate (GPM)", type: "number", placeholder: "Flow rate" },
  { key: "supplyTemp", label: "Supply Temp (°F)", type: "number", placeholder: "Supply temp" },
  { key: "returnTemp", label: "Return Temp (°F)", type: "number", placeholder: "Return temp" },
  { key: "pumpInfo", label: "Pump Info", type: "text", placeholder: "Pump details" },
  { key: "heating_curve", label: "Heating Curve", type: "object" },
  { key: "description", label: "Description", type: "textarea", placeholder: "Loop details..." },
];

function PrimaryHWNode(props) {
  return <BaseNode {...props} color="#ef4444" />;
}

const MemoizedPrimaryHWNode = memo(PrimaryHWNode);
MemoizedPrimaryHWNode.size = { width: 266, height: 154 };

export default MemoizedPrimaryHWNode;
