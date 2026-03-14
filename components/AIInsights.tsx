'use client';

import { useState } from 'react';
import type { VoltraContext } from '@/lib/context';

interface AIInsightsProps {
  context: VoltraContext;
}

type BriefingType = 'morning' | 'focus' | 'blockers' | 'weekly';

export default function AIInsights({ context }: AIInsightsProps) {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeType, setActiveType] = useState<BriefingType | null>(null);

  const generateBriefing = async (type: BriefingType) => {
    setIsLoading(true);
    setActiveType(type);
    setBriefing(null);

    try {
      const res = await fetch('/api/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, type }),
      });
      const data = await res.json();
      if (data.success) {
        setBriefing(data.briefing);
      } else {
        setBriefing('Failed to generate briefing. Please try again.');
      }
    } catch {
      setBriefing('Error connecting to AI. Check your API key.');
    } finally {
      setIsLoading(false);
    }
  };

  const briefingButtons: { type: BriefingType; label: string; icon: string }[] = [
    { type: 'morning', label: 'Daily Briefing', icon: '◆' },
    { type: 'focus', label: 'Focus Analysis', icon: '►' },
    { type: 'blockers', label: 'Risk Assessment', icon: '▲' },
    { type: 'weekly', label: 'Weekly Analysis', icon: '■' },
  ];

  return (
    <div className="insights-panel">
      <div className="insights-header">
        <h2 className="insights-title">AI Coach</h2>
        <span className="insights-badge">Powered by Claude</span>
      </div>

      <div className="insights-buttons">
        {briefingButtons.map(({ type, label, icon }) => (
          <button
            key={type}
            className={`insights-btn ${activeType === type ? 'active' : ''}`}
            onClick={() => generateBriefing(type)}
            disabled={isLoading}
          >
            <span className="insights-btn-icon">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="insights-content">
        {isLoading && (
          <div className="insights-loading">
            <div className="loading-spinner" />
            <span>Analyzing your dashboard...</span>
          </div>
        )}

        {!isLoading && briefing && (
          <div className="insights-text">
            {briefing.split('\n').map((line, i) => {
              // Handle markdown-style headers
              if (line.startsWith('**') && line.endsWith('**')) {
                return (
                  <h3 key={i} className="insights-heading">
                    {line.replace(/\*\*/g, '')}
                  </h3>
                );
              }
              if (line.startsWith('**')) {
                return (
                  <h3 key={i} className="insights-heading">
                    {line.replace(/\*\*/g, '')}
                  </h3>
                );
              }
              if (line.trim() === '') {
                return <br key={i} />;
              }
              return <p key={i}>{line}</p>;
            })}
          </div>
        )}

        {!isLoading && !briefing && (
          <div className="insights-empty">
            <p>Select an option above to get AI-powered insights about your performance and priorities.</p>
          </div>
        )}
      </div>
    </div>
  );
}
