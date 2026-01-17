import { memo } from "react";
import BaseNode from "./BaseNode.jsx";

export const PROPERTIES = [
  { key: "flowRate", label: "Flow Rate (GPM)", type: "number", placeholder: "Flow rate" },
  { key: "supplyTemp", label: "Supply Temp (°F)", type: "number", placeholder: "Supply temp" },
  { key: "returnTemp", label: "Return Temp (°F)", type: "number", placeholder: "Return temp" },
  { key: "heating_curve", label: "Heating Curve", type: "object" },
  { key: "description", label: "Description", type: "textarea", placeholder: "Loop details..." },
];

function SecondaryHWNode(props) {
  return <BaseNode {...props} color="#f97316" />;
}

const MemoizedSecondaryHWNode = memo(SecondaryHWNode);
MemoizedSecondaryHWNode.size = { width: 224, height: 126 };

export default MemoizedSecondaryHWNode;
