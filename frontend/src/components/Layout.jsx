import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const allNav = [
    { label: 'Overview',       group: true },
    {
      label: 'Dashboard',
      path: '/',
      icon: '▣',
      roles: ['admin', 'professor', 'student'],
    },

    { label: 'Setup',          group: true, roles: ['admin'] },
    { label: 'Departments',    path: '/departments',   icon: '◈', roles: ['admin'] },
    { label: 'Professors',     path: '/coordinators',  icon: '◈', roles: ['admin'] },
    { label: 'Students',       path: '/students',      icon: '◈', roles: ['admin'] },
    { label: 'Courses',        path: '/courses',       icon: '◈', roles: ['admin'] },
    { label: 'Batches',        path: '/batches',       icon: '◈', roles: ['admin'] },
    { label: 'Sections',       path: '/sections',      icon: '◈', roles: ['admin'] },
    { label: 'Slots',          path: '/slots',         icon: '◈', roles: ['admin'] },
    { label: 'Enrollment',     path: '/enrollment',    icon: '◈', roles: ['admin'] },
    { label: 'Manage Users',   path: '/users',         icon: '◈', roles: ['admin'] },

    { label: 'Attendance',     group: true },
    {
      label: 'Mark Attendance',
      path: '/attendance',
      icon: '▣',
      roles: ['admin', 'professor'],
    },
    {
      label: 'Reports',
      path: '/reports',
      icon: '▣',
      roles: ['admin', 'professor'],
    },
    {
      label: 'My Attendance',
      path: '/my-attendance',
      icon: '▣',
      roles: ['student'],
    },

    { label: 'System',         group: true, roles: ['admin'] },
    {
      label: 'Trigger Logs',
      path: '/logs',
      icon: '◈',
      roles: ['admin'],
    },
  ];

  const roleColors = {
    admin:     '#3b82f6',
    professor: '#10b981',
    student:   '#fbbf24',
  };

  const roleBg = {
    admin:     'rgba(59,130,246,0.12)',
    professor: 'rgba(16,185,129,0.12)',
    student:   'rgba(251,191,36,0.12)',
  };

  // Filter nav — for groups, only show if at least one child is visible for this role
  const visibleNav = allNav.filter(item => {
    if (!item.group) {
      return !item.roles || item.roles.includes(user?.role);
    }
    // For group headers — show only if at least one item after it is visible
    if (item.roles && !item.roles.includes(user?.role)) return false;
    return true;
  });

  // Remove orphan group headers (groups with no visible children after them)
  const cleanNav = visibleNav.filter((item, idx) => {
    if (!item.group) return true;
    // Check if any non-group item follows before the next group
    for (let i = idx + 1; i < visibleNav.length; i++) {
      if (visibleNav[i].group) break;
      return true;
    }
    return false;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 224,
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
        flexShrink: 0,
      }}>

        {/* Logo */}
        <div style={{
          padding: '20px 20px 14px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            fontSize: 13, fontWeight: 700,
            color: 'var(--accent2)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            Attendance
          </div>
          <div style={{
            fontSize: 10, color: 'var(--muted)',
            marginTop: 3, letterSpacing: '0.04em',
          }}>
            Management System
          </div>
        </div>

        {/* User info card */}
        {user && (
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'rgba(255,255,255,0.02)',
          }}>
            {/* Avatar + name row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 8,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: roleBg[user.role] || 'rgba(255,255,255,0.08)',
                border: `1px solid ${roleColors[user.role] || 'var(--border)'}33`,
                display: 'flex', alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14, fontWeight: 700,
                color: roleColors[user.role] || 'var(--text)',
                flexShrink: 0,
              }}>
                {user.full_name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600,
                  color: 'var(--text)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {user.full_name}
                </div>
                <div style={{
                  fontSize: 10, color: 'var(--muted)',
                  marginTop: 1,
                }}>
                  ID: {user.ref_id || user.user_id}
                </div>
              </div>
            </div>

            {/* Role badge */}
            <span style={{
              display: 'inline-block',
              fontSize: 10, fontWeight: 800,
              padding: '3px 10px', borderRadius: 20,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              background: roleBg[user.role] || 'rgba(255,255,255,0.08)',
              color: roleColors[user.role] || 'var(--text)',
              border: `1px solid ${roleColors[user.role] || 'var(--border)'}44`,
            }}>
              {user.role}
            </span>
          </div>
        )}

        {/* Nav items */}
        <nav style={{ padding: '8px 0', flex: 1 }}>
          {cleanNav.map((item, i) =>
            item.group ? (
              <div key={i} style={{
                fontSize: 9, fontWeight: 800,
                color: 'var(--muted)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                padding: '16px 20px 5px',
              }}>
                {item.label}
              </div>
            ) : (
              <NavLink
                key={i}
                to={item.path}
                end={item.path === '/'}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '8px 20px',
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--accent2)' : 'var(--muted)',
                  borderLeft: `3px solid ${isActive
                    ? 'var(--accent)' : 'transparent'}`,
                  background: isActive
                    ? 'rgba(59,130,246,0.08)' : 'transparent',
                  transition: 'all 0.12s',
                  borderRadius: '0 6px 6px 0',
                  marginRight: 8,
                })}
                onMouseOver={e => {
                  if (!e.currentTarget.style.background.includes('0.08')) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.color = 'var(--text)';
                  }
                }}
                onMouseOut={e => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--muted)';
                  }
                }}
              >
                <span style={{
                  fontSize: 13,
                  opacity: 0.8,
                  flexShrink: 0,
                }}>
                  {item.icon}
                </span>
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        {/* Bottom section */}
        <div style={{
          padding: '12px 14px 16px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          {/* Tech stack tag */}
          <div style={{
            fontSize: 9, color: 'var(--muted)',
            textAlign: 'center',
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.04em',
            opacity: 0.6,
          }}>
            Oracle · Python · React
          </div>

          {/* Sign out button */}
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '9px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8, color: '#f87171',
              fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              letterSpacing: '0.04em',
              transition: 'all 0.15s',
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)';
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{
        flex: 1,
        padding: '32px 36px',
        overflowY: 'auto',
        minWidth: 0,
      }}>
        {children}
      </main>
    </div>
  );
}