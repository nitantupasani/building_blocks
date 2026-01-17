import { memo, useEffect, useRef } from "react";
import { Handle, Position, NodeResizer } from "reactflow";
import "./BaseNode.css";
import HeatingCurveBlock from "./HeatingCurveBlock.jsx";

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
                ) : prop.type === "list" ? (
                  <div className="base-node__list">
                    {Array.isArray(data?.[prop.key]) && data[prop.key].length > 0 ? (
                      <ul className="base-node__list-items">
                        {data[prop.key].map((item, index) => (
                          <li key={index} className="base-node__list-item">
                            {typeof item === "object" ? (
                              <div className="base-node__list-object">
                                {Object.entries(item).map(([key, value]) => (
                                  <div key={key} className="base-node__list-field">
                                    <strong>{key}:</strong> {String(value)}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              String(item)
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="base-node__list-empty">No items</span>
                    )}
                  </div>
                ) : prop.type === "object" ? (
                  <div className="base-node__object">
                    {data?.[prop.key] ? (
                      <div className="base-node__object-block">
                        <div><strong>{data[prop.key].label || data[prop.key].label || 'Heating Curve'}</strong></div>
                        <div>Equipment: {data[prop.key].equipment || 'N/A'}</div>
                        <div>Sensors: {data[prop.key].sensors_count ?? 0}</div>
                        {Array.isArray(data[prop.key].sensors) && data[prop.key].sensors.length > 0 && (
                          <ul className="base-node__list-items">
                            {data[prop.key].sensors.map((s, i) => (
                              <li key={i} className="base-node__list-item">
                                {typeof s === 'object' ? (
                                  <div className="base-node__list-object">
                                    {Object.entries(s).map(([k, v]) => (
                                      <div key={k} className="base-node__list-field"><strong>{k}:</strong> {String(v)}</div>
                                    ))}
                                  </div>
                                ) : String(s)}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <div className="base-node__none">None</div>
                    )}
                  </div>
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

      {/* Attached heating-curve visual block (shares wall with loop) */}
      {data?.heating_curve && String(blockType).includes("hw") && (
        <HeatingCurveBlock
          parentId={id}
          heatingCurve={data.heating_curve}
          isParentExpanded={isExpanded}
          onOpenHeatingCurve={data?.onOpenHeatingCurve}
          onToggleParentExpand={data?.onToggleExpand}
        />
      )}

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
