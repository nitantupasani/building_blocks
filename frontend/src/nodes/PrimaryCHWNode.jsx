import { memo } from "react";
import BaseNode from "./BaseNode.jsx";

const PROPERTIES = [
  { key: "flowRate", label: "Flow Rate (GPM)", type: "number", placeholder: "Flow rate" },
  { key: "supplyTemp", label: "Supply Temp (°F)", type: "number", placeholder: "Supply temp" },
  { key: "returnTemp", label: "Return Temp (°F)", type: "number", placeholder: "Return temp" },
  { key: "chillerInfo", label: "Chiller Info", type: "text", placeholder: "Chiller details" },
  { key: "description", label: "Description", type: "textarea", placeholder: "Loop details..." },
];

function PrimaryCHWNode(props) {
  return <BaseNode {...props} color="#3b82f6" properties={PROPERTIES} />;
}

const MemoizedPrimaryCHWNode = memo(PrimaryCHWNode);
MemoizedPrimaryCHWNode.size = { width: 266, height: 154 };

export default MemoizedPrimaryCHWNode;
