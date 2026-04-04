'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Overview' },
  { href: '/projects', label: 'Projects' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/goals', label: 'Goals' },
  { href: '/todos', label: 'Todos' },
  { href: '/jobs', label: 'Clients' },
  { href: '/log', label: 'Work Log' },
  { href: '/experiments', label: 'AI Lab' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-brand">
          <img src="/branding/logo.png" alt="Voltra" className="brand-logo" />
          <div className="brand-text">
            <span className="brand-name">Command Center</span>
            <span className="brand-sub">Mission Control</span>
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
