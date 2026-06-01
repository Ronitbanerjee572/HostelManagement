import { useAuth } from '../context/AuthContext';

export default function Layout({ title, subtitle, children }) {
  const { role, username, studentId, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">
            H
          </span>
          <div>
            <h1>Hostel Management</h1>
            <p className="brand-tagline">Oracle Cloud Gateway Portal</p>
          </div>
        </div>
        <div className="header-meta">
          <div className="user-chip">
            <span className={`role-badge role-${role}`}>{role}</span>
            <span className="user-name">{username || 'User'}</span>
            {role === 'student' && studentId && (
              <span className="student-id">ID: {studentId}</span>
            )}
          </div>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="app-main">
        {(title || subtitle) && (
          <div className="page-heading">
            {title && <h2>{title}</h2>}
            {subtitle && <p>{subtitle}</p>}
          </div>
        )}
        {children}
      </main>

      <footer className="app-footer">
        <span>Connected to gateway at localhost:5000</span>
      </footer>
    </div>
  );
}
