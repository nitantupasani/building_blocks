import { memo } from "react";
import BaseNode from "./BaseNode.jsx";

const PROPERTIES = [
  { key: "address", label: "Address", type: "text", placeholder: "Building address..." },
  { key: "floors", label: "Floors", type: "number", placeholder: "Number of floors" },
  { key: "area", label: "Area (sqft)", type: "number", placeholder: "Total area" },
  { key: "description", label: "Description", type: "textarea", placeholder: "Building details..." },
];

function BuildingNode(props) {
  return <BaseNode {...props} color="#94a3b8" properties={PROPERTIES} />;
}

const MemoizedBuildingNode = memo(BuildingNode);
MemoizedBuildingNode.size = { width: 336, height: 196 };

export default MemoizedBuildingNode;