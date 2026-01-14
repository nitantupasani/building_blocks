import { memo } from "react";
import BaseNode from "./BaseNode.jsx";

const PROPERTIES = [
  { key: "flowRate", label: "Flow Rate (GPM)", type: "number", placeholder: "Flow rate" },
  { key: "supplyTemp", label: "Supply Temp (°F)", type: "number", placeholder: "Supply temp" },
  { key: "returnTemp", label: "Return Temp (°F)", type: "number", placeholder: "Return temp" },
  { key: "pumpInfo", label: "Pump Info", type: "text", placeholder: "Pump details" },
  { key: "description", label: "Description", type: "textarea", placeholder: "Loop details..." },
];

function PrimaryHWNode(props) {
  return <BaseNode {...props} color="#ef4444" properties={PROPERTIES} />;
}

const MemoizedPrimaryHWNode = memo(PrimaryHWNode);
MemoizedPrimaryHWNode.size = { width: 190, height: 110 };

export default MemoizedPrimaryHWNode;
