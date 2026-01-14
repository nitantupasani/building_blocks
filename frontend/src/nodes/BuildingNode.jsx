import { memo, useEffect, useRef } from "react";
import { NodeResizer } from "reactflow";
import "./BuildingNode.css";

function BuildingNode({ id, data, selected }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (data.isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [data.isEditing]);

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      data.onFinishEdit();
    }
  };

  return (
    <div className={"building-node"}>
      <NodeResizer
        isVisible={selected}
        minWidth={120}
        minHeight={80}
        handleStyle={{ width: 10, height: 10, borderRadius: 4 }}
        lineStyle={{ borderColor: "#0078d7" }}
      />
      {data.isEditing ? (
        <input
          ref={inputRef}
          className="building-node__input"
          value={data.label}
          onChange={(event) => data.onChangeLabel(id, event.target.value)}
          onBlur={data.onFinishEdit}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <div className="building-node__label">{data.label}</div>
      )}
    </div>
  );
}

export default memo(BuildingNode);
