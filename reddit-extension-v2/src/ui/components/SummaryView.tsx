import React from 'react';
import { ThreadSummary } from '../../types';

interface SummaryViewProps {
  summary: ThreadSummary;
}

export const SummaryView: React.FC<SummaryViewProps> = ({ summary }) => {
  // Support both new and legacy response structure
  const overviewText = summary.threadSummary || summary.summary;
  
  return (
    <div className="summary-scroll-container">
      <div className="panel-content">
        {/* Thread Summary */}
        <div className="panel-section">
          <h3 className="section-title">
            📊 Thread Summary
          </h3>
          <div className="section-content">
            {overviewText}
          </div>
        </div>

        {/* Key Points */}
        {summary.keyPoints && summary.keyPoints.length > 0 && (
          <div className="panel-section">
            <h3 className="section-title">
              🎯 Key Points
            </h3>
            <ul className="key-points-list">
              {summary.keyPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Community Sentiment (new structure) */}
        {summary.communitySentiment && (
          <div className="panel-section">
            <h3 className="section-title">
              💬 Community Sentiment
            </h3>
            <div className="sentiment-container">
              {summary.communitySentiment.supportive && (
                <div className="sentiment-item supportive">
                  <span className="sentiment-label">👍 Supportive:</span>
                  <p>{summary.communitySentiment.supportive}</p>
                </div>
              )}
              {summary.communitySentiment.skeptical && (
                <div className="sentiment-item skeptical">
                  <span className="sentiment-label">🤔 Skeptical:</span>
                  <p>{summary.communitySentiment.skeptical}</p>
                </div>
              )}
              {summary.communitySentiment.neutral && (
                <div className="sentiment-item neutral">
                  <span className="sentiment-label">📝 Neutral:</span>
                  <p>{summary.communitySentiment.neutral}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Legacy insights field */}
        {!summary.communitySentiment && summary.insights && (
          <div className="panel-section">
            <h3 className="section-title">
              🔄 Different Perspectives
            </h3>
            <div className="section-content">
              {summary.insights}
            </div>
          </div>
        )}

        {/* Notable Comments (new structure) */}
        {summary.notableComments && summary.notableComments.length > 0 && (
          <div className="panel-section">
            <h3 className="section-title">
              💎 Notable Comments
            </h3>
            <div className="notable-comments">
              {summary.notableComments.map((comment, index) => (
                <div key={index} className={`notable-comment ${comment.type}`}>
                  <div className="comment-type">
                    {comment.type === 'main_insight' && '💡'}
                    {comment.type === 'criticism' && '⚠️'}
                    {comment.type === 'advice' && '✅'}
                  </div>
                  <div className="comment-content">
                    <p className="comment-summary">{comment.summary}</p>
                    {comment.quote && (
                      <blockquote className="comment-quote">"{comment.quote}"</blockquote>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Practical Takeaways (new structure) */}
        {summary.practicalTakeaways && summary.practicalTakeaways.length > 0 && (
          <div className="panel-section">
            <h3 className="section-title">
              🚀 Practical Takeaways
            </h3>
            <ul className="key-points-list">
              {summary.practicalTakeaways.map((takeaway, index) => (
                <li key={index}>{takeaway}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Legacy practicalValue field */}
        {!summary.practicalTakeaways && summary.practicalValue && (
          <div className="panel-section">
            <h3 className="section-title">
              💡 Practical Value
            </h3>
            <div className="section-content">
              {summary.practicalValue}
            </div>
          </div>
        )}

        {/* Bottom Line */}
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
