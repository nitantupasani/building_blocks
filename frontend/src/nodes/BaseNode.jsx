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
    building: "22px",
    "primary-hw": "20px",
    "primary-chw": "20px",
    "secondary-hw": "20px",
    "secondary-chw": "20px",
    "tertiary-hw": "18px",
    "tertiary-chw": "18px",
    "heating-curve": "18px",
    sensor: "12px",
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
      {(data?.blockType === 'ahu' || String(className).includes('base-node--ahu')) && (
        <div className="base-node__icon" title="AHU">
          <img src="/ahu-icon.png" alt="AHU" />
        </div>
      )}
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
      {data?.heating_curve && (String(blockType).includes("hw") || String(blockType) === 'ahu') && (
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
