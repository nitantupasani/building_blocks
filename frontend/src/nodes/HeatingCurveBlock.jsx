import React, { useState } from 'react';
import './BaseNode.css';

function HeatingCurveBlock({ parentId, heatingCurve, isParentExpanded, onOpenHeatingCurve, onToggleParentExpand }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleOpen = (e) => {
    e.stopPropagation();
    if (onOpenHeatingCurve) {
      onOpenHeatingCurve(parentId, heatingCurve?.id);
      return;
    }
    setIsExpanded((s) => !s);
  };

  const handleToggleParent = (e) => {
    e.stopPropagation();
    onToggleParentExpand?.(parentId);
  };

  if (!heatingCurve) return null;

  return (
    <div className={`base-node__attached-curve heating-curve-block ${isExpanded ? 'expanded' : 'collapsed'}`} onClick={(e) => e.stopPropagation()}>
      <div className="heating-curve__handle top" />
      <div className="heating-curve__handle left" />
      <div className="heating-curve__handle right" />
      <div className="heating-curve__handle bottom" />

      {/* expand btn for the heating curve block (handled by bottom button) */}

      {!isExpanded ? (
        <div className="heating-curve__content">
          <div className="heating-curve__title">{heatingCurve.label || 'Heating Curve'}</div>
        </div>
      ) : (
        <div className="heating-curve__content">
          <div className="heating-curve__title">{heatingCurve.label || 'Heating Curve'}</div>
          <div className="heating-curve__meta">Equipment: {heatingCurve.equipment || 'N/A'}</div>
          <div className="heating-curve__meta">Sensors: {heatingCurve.sensors_count ?? 0}</div>
          {Array.isArray(heatingCurve.sensors) && heatingCurve.sensors.length > 0 && (
            <ul className="heating-curve__sensors base-node__list-items">
              {heatingCurve.sensors.map((s, i) => (
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
      )}
      {/* bottom expand button moved outside content */}
      <button
        className="heating-curve__expand-btn"
        onClick={handleOpen}
        type="button"
        aria-expanded={isExpanded}
        aria-label="Toggle heating curve"
      >
        {isExpanded ? '−' : '+'}
      </button>
    </div>
  );
}

export default HeatingCurveBlock;
