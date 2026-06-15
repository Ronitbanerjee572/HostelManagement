import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, loading, error, isAuthenticated, role, setError } = useAuth();
  const navigate = useNavigate();
  // Changed state from username to email to match backend
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  if (isAuthenticated) {
    return <Navigate to={role === 'admin' ? '/admin' : '/student'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setError(null);

    if (!email.trim() || !password) {
      setLocalError('Email and password are required.');
      return;
    }

    try {
      const session = await login(email, password);
      navigate(session.role === 'admin' ? '/admin' : '/student', { replace: true });
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const displayError = localError || error;

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="brand-icon brand-icon-lg" aria-hidden="true">
            H
          </span>
          <h1>Welcome back</h1>
          <p>Sign in as an administrator or student to access your dashboard.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {displayError && (
            <div className="alert alert-error" role="alert">
              {displayError}
            </div>
          )}

          <label className="field">
            <span>Email Address</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@hostel.com or student email"
              disabled={loading}
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
            />
          </label>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="login-hints">
          <p>
            <strong>Admin:</strong> use your admin credentials for room, fee, and complaint operations.
          </p>
          <p>
            <strong>Student:</strong> use your student account to view fees and file complaints.
          </p>
        </div>
      </div>
    </div>
  );
}