'use client';

import Link from 'next/link';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  href?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  accentColor?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  href,
  icon,
  accentColor,
}: StatCardProps) {
  const content = (
    <div className="stat-card" style={accentColor ? { '--card-accent': accentColor } as React.CSSProperties : undefined}>
      <div className="stat-header">
        {icon && <div className="stat-icon">{icon}</div>}
        <span className="stat-title">{title}</span>
      </div>
      <div className="stat-value">{value}</div>
      {subtitle && <div className="stat-subtitle">{subtitle}</div>}
      {href && (
        <div className="stat-arrow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} className="stat-card-link">{content}</Link>;
  }

  return content;
}
