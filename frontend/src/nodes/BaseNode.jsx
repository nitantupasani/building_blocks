import { memo, useEffect, useRef } from "react";
import { Handle, Position, NodeResizer } from "reactflow";
import "./BaseNode.css";

function BaseNode({ id, data, color, properties = [] }) {
  const inputRef = useRef(null);
  const label = data?.label ?? "Node";
  const isEditing = !!data?.isEditing;
  const isExpanded = !!data?.isExpanded;
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
    sensor: "8px",
  };

  const fontSize = fontSizes[blockType] || "14px";

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleToggleExpand = (e) => {
    e.stopPropagation();
    data?.onToggleExpand?.(id);
  };

  const handlePropertyChange = (property, value) => {
    data?.onPropertyChange?.(id, property, value);
  };

  return (
    <div className="base-node" style={{ backgroundColor: color }}>
      <NodeResizer
        minWidth={100}
        minHeight={80}
        isVisible={data?.selected}
      />
      <Handle position={Position.Top} id="top" />
      <Handle position={Position.Left} id="left" />
      <Handle position={Position.Right} id="right" />
      <Handle position={Position.Bottom} id="bottom" />

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

        {isExpanded && properties.length > 0 && (
          <div className="base-node__properties">
            {properties.map((prop) => (
              <div key={prop.key} className="base-node__property">
                <label>{prop.label}:</label>
                {prop.type === "textarea" ? (
                  <textarea
                    value={data?.[prop.key] || ""}
                    onChange={(e) => handlePropertyChange(prop.key, e.target.value)}
                    className="base-node__textarea"
                    placeholder={prop.placeholder || ""}
                    rows={2}
                  />
                ) : prop.type === "number" ? (
                  <input
                    type="number"
                    value={data?.[prop.key] || ""}
                    onChange={(e) => handlePropertyChange(prop.key, e.target.value)}
                    className="base-node__number-input"
                    placeholder={prop.placeholder || ""}
                  />
                ) : (
                  <input
                    type="text"
                    value={data?.[prop.key] || ""}
                    onChange={(e) => handlePropertyChange(prop.key, e.target.value)}
                    className="base-node__text-input"
                    placeholder={prop.placeholder || ""}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        className="base-node__expand-btn"
        onClick={handleToggleExpand}
        type="button"
      >
        {isExpanded ? "−" : "+"}
      </button>
    </div>
  );
}

export default memo(BaseNode);
