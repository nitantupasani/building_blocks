import { memo } from "react";
import BaseNode from "./BaseNode.jsx";

export const PROPERTIES = [
  { key: "flowRate", label: "Flow Rate (GPM)", type: "number", placeholder: "Flow rate" },
  { key: "supplyTemp", label: "Supply Temp (°F)", type: "number", placeholder: "Supply temp" },
  { key: "returnTemp", label: "Return Temp (°F)", type: "number", placeholder: "Return temp" },
  { key: "description", label: "Description", type: "textarea", placeholder: "Loop details..." },
];

function SecondaryCHWNode(props) {
  return <BaseNode {...props} color="#06b6d4" />;
}

const MemoizedSecondaryCHWNode = memo(SecondaryCHWNode);
MemoizedSecondaryCHWNode.size = { width: 224, height: 126 };

export default MemoizedSecondaryCHWNode;
