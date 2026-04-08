'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/lib/useAppContext';
import Modal from '@/components/Modal';

type ExperimentType = 'morning' | 'focus' | 'blockers' | 'weekly';

interface Experiment {
  id: ExperimentType;
  title: string;
  icon: string;
  description: string;
  color: string;
}

const experiments: Experiment[] = [
  {
    id: 'morning',
    title: 'Daily Executive Briefing',
    icon: '◆',
    description: 'Situation summary, critical path items, revenue operations status, and recommended actions.',
    color: 'var(--gold)',
  },
  {
    id: 'focus',
    title: 'Focus Recommendation',
    icon: '►',
    description: 'Operational analysis to identify the highest-priority deliverable based on impact and urgency.',
    color: 'var(--info)',
  },
  {
    id: 'blockers',
    title: 'Risk Assessment',
    icon: '▲',
    description: 'Identify stalled initiatives, goal attainment risks, and resource allocation issues.',
    color: 'var(--warning)',
  },
  {
    id: 'weekly',
    title: 'Weekly Performance Analysis',
    icon: '■',
    description: 'Performance scorecard, accomplishments, shortfalls, pattern analysis, and strategic recommendations.',
    color: 'var(--success)',
  },
];

export default function ExperimentsPage() {
  const { ctx, isLoading: isLoadingContext } = useAppContext();
  const [activeExperiment, setActiveExperiment] = useState<ExperimentType | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  if (isLoadingContext) {
    return (
      <main className="page-container">
        <div className="loading-spinner" style={{ margin: '100px auto' }} />
      </main>
    );
  }

  const runExperiment = async (type: ExperimentType) => {
    setActiveExperiment(type);
    setIsLoading(true);
    setReport(null);
    setCopied(false);

    try {
      const res = await fetch('/api/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: ctx, type }),
      });
      const data = await res.json();
      if (data.success) {
        setReport(data.briefing);
      } else {
        setReport('Failed to generate report. Please check your API key and try again.');
      }
    } catch {
      setReport('Error connecting to AI. Make sure ANTHROPIC_API_KEY is set.');
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setActiveExperiment(null);
    setReport(null);
    setCopied(false);
  };

  const copyToClipboard = async () => {
    if (!report) return;
    const exp = experiments.find(e => e.id === activeExperiment);
    const text = `# ${exp?.title || 'Report'}\nGenerated: ${new Date().toLocaleString()}\n\n${report}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const downloadReport = () => {
    if (!report) return;
    const exp = experiments.find(e => e.id === activeExperiment);
    const text = `# ${exp?.title || 'Report'}\nGenerated: ${new Date().toLocaleString()}\n\n${report}`;
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeExperiment}-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeExp = experiments.find(e => e.id === activeExperiment);

  return (
    <main className="page-container">
      <div className="page-header">
        <h1 className="page-title">AI Experiments</h1>
        <p className="page-subtitle">
          Test AI-powered insights and reports. Each experiment analyzes your dashboard and generates actionable intelligence.
        </p>
      </div>

      <div className="experiments-grid">
        {experiments.map((exp) => (
          <button
            key={exp.id}
            className="experiment-card"
            onClick={() => runExperiment(exp.id)}
            style={{ '--exp-color': exp.color } as React.CSSProperties}
          >
            <div className="experiment-icon">{exp.icon}</div>
            <h3 className="experiment-title">{exp.title}</h3>
            <p className="experiment-desc">{exp.description}</p>
            <span className="experiment-cta">Run Experiment →</span>
          </button>
        ))}
      </div>

      <Modal
        isOpen={activeExperiment !== null}
        onClose={closeModal}
        title={activeExp?.title || 'Report'}
      >
        {isLoading ? (
          <div className="modal-loading">
            <div className="loading-spinner" />
            <p>Claude is analyzing your dashboard...</p>
          </div>
        ) : report ? (
          <>
            <div className="report-content">
              {report.split('\n').map((line, i) => {
                if (line.startsWith('**') || line.includes('**')) {
                  const cleanLine = line.replace(/\*\*/g, '');
                  if (line.startsWith('**')) {
                    return <h3 key={i} className="report-heading">{cleanLine}</h3>;
                  }
                  const parts = line.split(/(\*\*.*?\*\*)/g);
                  return (
                    <p key={i}>
                      {parts.map((part, j) =>
                        part.startsWith('**') && part.endsWith('**')
                          ? <strong key={j}>{part.slice(2, -2)}</strong>
                          : <span key={j}>{part}</span>
                      )}
                    </p>
                  );
                }
                if (line.startsWith('- ') || line.startsWith('• ')) {
                  return <li key={i}>{line.substring(2)}</li>;
                }
                if (line.match(/^\d+\./)) {
                  return <li key={i}>{line.substring(line.indexOf('.') + 2)}</li>;
                }
                if (line.trim() === '') {
                  return <br key={i} />;
                }
                return <p key={i}>{line}</p>;
              })}
            </div>
            <div className="report-actions">
              <button className="btn" onClick={copyToClipboard}>
                {copied ? '✓ Copied!' : 'Copy to Clipboard'}
              </button>
              <button className="btn btn-primary" onClick={downloadReport}>
                Download .md
              </button>
            </div>
          </>
        ) : null}
      </Modal>
    </main>
  );
}
