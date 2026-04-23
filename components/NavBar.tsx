'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggleCompact from './ThemeToggleCompact';

const navItems = [
  { href: '/', label: 'Overview' },
  { href: '/projects', label: 'Projects' },
  { href: '/schedule', label: 'Calendar' },
  { href: '/goals', label: 'Tasks' },
  { href: '/clients', label: 'Clients' },
  { href: '/meetings', label: 'Meetings' },
  { href: '/experiments', label: 'AI Lab' },
  { href: '/admin', label: 'Admin' },
];

export default function NavBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-brand">
          <img src="/Vstar.svg" alt="Voltra" className="brand-logo" />
          <div className="brand-text">
            <span className="brand-name">Mission Control</span>
          </div>
        </Link>

        <nav className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
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

        <div className="navbar-right">
          <div className="navbar-status">
            <div className="status-indicator" />
            <span className="status-text">Live</span>
          </div>
          <ThemeToggleCompact />
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span className={`hamburger ${mobileOpen ? 'open' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
