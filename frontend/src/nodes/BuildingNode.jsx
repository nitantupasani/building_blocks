import { memo, useEffect, useRef } from "react";
import { Handle, Position } from "reactflow";
import "./BuildingNode.css";

function BuildingNode({ id, data }) {
  const inputRef = useRef(null);
  const label = data?.label ?? "Building";
  const isEditing = !!data?.isEditing;

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  return (
    <div className="building-node">
      <Handle type="target" position={Position.Top} id="t" />
      <Handle type="target" position={Position.Left} id="l" />
      <Handle type="source" position={Position.Right} id="r" />
      <Handle type="source" position={Position.Bottom} id="b" />

      {isEditing ? (
        <input
          ref={inputRef}
          className="building-node__input"
          value={label}
          onChange={(e) => data?.onChangeLabel?.(id, e.target.value)}
          onBlur={() => data?.onFinishEdit?.()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") data?.onFinishEdit?.();
          }}
        />
      ) : (
        <div className="building-node__label">{label}</div>
      )}
    </div>
  );
}

export default memo(BuildingNode);