import React, { useState } from 'react';
import '../Styles/DbtComparisonView.css';

type DbtComparisonViewProps = {
  originalSql: Record<string, string>;
  dbtModels: Record<string, string>;
  dbtFilePaths: Record<string, string>;
  onClose: () => void;
};

const DbtComparisonView = ({ originalSql, dbtModels, dbtFilePaths, onClose }: DbtComparisonViewProps) => {
  const [panelWidth, setPanelWidth] = useState(50); // Default 50% width for each panel

  const handleDrag = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startWidth = panelWidth;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const container = document.querySelector('.code-comparison') as HTMLElement;
      if (container) {
        const containerWidth = container.offsetWidth;
        const deltaX = moveEvent.clientX - startX;
        const newWidth = (startWidth + (deltaX / containerWidth) * 100);
        
        // Limit width between 20% and 80%
        setPanelWidth(Math.max(20, Math.min(80, newWidth)));
      }
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="dbt-comparison-container">
      <div className="comparison-header">
        <h2>dbt Model Comparison</h2>
        <button onClick={onClose} className="close-button">
          ×
        </button>
      </div>
      
      <div className="comparison-grid">
        {Object.entries(originalSql).map(([level, sql]) => (
          <div key={level} className="level-comparison">
            <h3>Level {level}</h3>
            <div className="code-comparison">
              <div 
                className="code-panel original-sql" 
                style={{ width: `${panelWidth}%` }}
              >
                <h4>Original SQL</h4>
                <pre>{sql}</pre>
              </div>
              
              <div 
                className="resize-handle" 
                onMouseDown={handleDrag}
              />
              
              <div 
                className="code-panel dbt-sql" 
                style={{ width: `${100 - panelWidth}%` }}
              >
                <h4>{dbtFilePaths[level] || 'No file path available'}</h4>
                <pre>{dbtModels[level] || 'No conversion available'}</pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DbtComparisonView;