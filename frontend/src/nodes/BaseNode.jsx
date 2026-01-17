import { memo, useEffect, useRef } from "react";
import { Handle, Position, NodeResizer } from "reactflow";
import "./BaseNode.css";
import HeatingCurveBlock from "./HeatingCurveBlock.jsx";

function BaseNode({
  id,
  data,
  color,
  className = "",
  showHandles = true,
  showResizer = true,
  onClick,
}) {
  const inputRef = useRef(null);
  const label = data?.label ?? "Node";
  const isEditing = !!data?.isEditing;
  const blockType = data?.blockType || "building";

  // Font sizes based on block type
  const fontSizes = {
    building: "14px",
    "primary-hw": "12px",
    "primary-chw": "12px",
    "secondary-hw": "11px",
    "secondary-chw": "11px",
    "tertiary-hw": "10px",
    "tertiary-chw": "10px",
    "heating-curve": "10px",
    sensor: "8px",
  };

  const fontSize = fontSizes[blockType] || "14px";

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  return (
    <div
      className={`base-node ${className}`.trim()}
      style={{ backgroundColor: color }}
      onClick={onClick}
    >
      {showResizer && (
        <NodeResizer
          minWidth={100}
          minHeight={80}
          isVisible={data?.selected}
        />
      )}
      {showHandles && (
        <>
          <Handle position={Position.Top} id="top" />
          <Handle position={Position.Left} id="left" />
          <Handle position={Position.Right} id="right" />
          <Handle position={Position.Bottom} id="bottom" />
        </>
      )}

      <div className="base-node__content">
        {isEditing ? (
          <input
            ref={inputRef}
            className="base-node__input"
            style={{ fontSize }}
            value={label}
            onChange={(e) => data?.onChangeLabel?.(id, e.target.value)}
            onBlur={() => data?.onFinishEdit?.()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape") data?.onFinishEdit?.();
            }}
          />
        ) : (
          <div className="base-node__label" style={{ fontSize }}>
            {label}
          </div>
        )}
      </div>

      {/* Attached heating-curve visual block (shares wall with loop) */}
      {data?.heating_curve && String(blockType).includes("hw") && (
        <HeatingCurveBlock
          parentId={id}
          heatingCurve={data.heating_curve}
          isSelected={data?.heatingCurveSelected}
          onSelect={data?.onSelectHeatingCurve}
        />
      )}
    </div>
  );
}

export default memo(BaseNode);
