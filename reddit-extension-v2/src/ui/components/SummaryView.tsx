import React from 'react';
import { ThreadSummary } from '../../types';

interface SummaryViewProps {
  summary: ThreadSummary;
}

export const SummaryView: React.FC<SummaryViewProps> = ({ summary }) => {
  return (
    <div className="summary-scroll-container">
      <div className="panel-content">
        <div className="panel-section">
          <h3 className="section-title">
            📊 Overview
          </h3>
          <div className="section-content">
            {summary.summary}
          </div>
        </div>

        {summary.keyPoints && summary.keyPoints.length > 0 && (
          <div className="panel-section">
            <h3 className="section-title">
              🎯 The Real Takeaways
            </h3>
            <ul className="key-points-list">
              {summary.keyPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
        )}

        {summary.insights && (
          <div className="panel-section">
            <h3 className="section-title">
              🔄 Different Perspectives
            </h3>
            <div className="section-content">
              {summary.insights}
            </div>
          </div>
        )}

        {summary.practicalValue && (
          <div className="panel-section">
            <h3 className="section-title">
              💡 Practical Value
            </h3>
            <div className="section-content">
              {summary.practicalValue}
            </div>
          </div>
        )}

        {summary.bottomLine && (
          <div className="panel-section bottom-line-section">
            <h3 className="section-title">
              ⚡ Bottom Line
            </h3>
            <div className="section-content bottom-line">
              {summary.bottomLine}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
