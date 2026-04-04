'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Overview' },
  { href: '/projects', label: 'Projects' },
  { href: '/goals', label: 'Goals' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/jobs', label: 'Clients' },
  { href: '/log', label: 'Work Log' },
  { href: '/todos', label: 'Todos' },
  { href: '/experiments', label: 'AI Lab' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-brand">
          <span className="brand-icon">V</span>
          <div className="brand-text">
            <span className="brand-name">Command Center</span>
            <span className="brand-sub">Operations Dashboard</span>
          </div>
        </Link>

        <nav className="navbar-links">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${
                item.href === '/'
                  ? pathname === '/' ? 'active' : ''
                  : pathname.startsWith(item.href) ? 'active' : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="navbar-status">
          <div className="status-indicator" />
          <span className="status-text">Live</span>
        </div>
      </div>
    </header>
  );
}
