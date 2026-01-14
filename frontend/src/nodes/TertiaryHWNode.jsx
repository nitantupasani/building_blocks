import { memo } from "react";
import BaseNode from "./BaseNode.jsx";

const PROPERTIES = [
  { key: "flowRate", label: "Flow Rate (GPM)", type: "number", placeholder: "Flow rate" },
  { key: "supplyTemp", label: "Supply Temp (°F)", type: "number", placeholder: "Supply temp" },
  { key: "returnTemp", label: "Return Temp (°F)", type: "number", placeholder: "Return temp" },
  { key: "description", label: "Description", type: "textarea", placeholder: "Loop details..." },
];

function TertiaryHWNode(props) {
  return <BaseNode {...props} color="#fbbf24" properties={PROPERTIES} />;
}

const MemoizedTertiaryHWNode = memo(TertiaryHWNode);
MemoizedTertiaryHWNode.size = { width: 135, height: 75 };

export default MemoizedTertiaryHWNode;
