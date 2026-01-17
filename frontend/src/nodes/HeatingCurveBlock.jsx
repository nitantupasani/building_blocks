import BaseNode from "./BaseNode.jsx";
import "./BaseNode.css";

function HeatingCurveBlock({ parentId, heatingCurve, isSelected, onSelect }) {
  if (!heatingCurve) return null;

  const handleSelect = (event) => {
    event.stopPropagation();
    onSelect?.(parentId, heatingCurve?.id);
  };

  return (
    <BaseNode
      id={`${parentId}-heating-curve`}
      data={{
        label: heatingCurve.label || "Heating Curve",
        blockType: "heating-curve",
      }}
      color="#ffffff"
      className={`base-node__attached-curve heating-curve-block${isSelected ? " heating-curve-block--selected" : ""}`}
      showHandles={false}
      showResizer={false}
      onClick={handleSelect}
    />
  );
}

export default HeatingCurveBlock;
