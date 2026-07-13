import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {

  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);


  const submit = async (e) => {

    e.preventDefault();

    if (!username || !password) {
      setError('Enter username and password');
      return;
    }

    setLoading(true);
    setError('');

    const res = await login(username, password);

    setLoading(false);

    if (res.success) {
      navigate('/');
    } else {
      setError(res.error || 'Login failed');
    }
  };


  return (

    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
    }}>

      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '40px 36px',
      }}>


        {/* Logo */}

        <div style={{ textAlign: 'center', marginBottom: 32 }}>

          <div style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--accent2)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            Attendance Management System
          </div>

          <div style={{
            fontSize: 12,
            color: 'var(--muted)',
            marginTop: 4
          }}>
            Oracle · Python · React
          </div>

        </div>


        <form onSubmit={submit}>

          {/* Username */}

          <div style={{ marginBottom: 16 }}>

            <label style={{
              fontSize: 11,
              color: 'var(--muted)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'block',
              marginBottom: 6,
            }}>
              Username
            </label>

            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoFocus
              style={{
                width: '100%',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text)',
                padding: '10px 14px',
                fontSize: 14,
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#3b82f6'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />

          </div>


          {/* Password */}

          <div style={{ marginBottom: 24 }}>

            <label style={{
              fontSize: 11,
              color: 'var(--muted)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'block',
              marginBottom: 6,
            }}>
              Password
            </label>


            <div style={{ position: 'relative' }}>

              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--text)',
                  padding: '10px 40px 10px 14px',
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = '#3b82f6'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />


              {/* Eye Toggle */}

              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  fontSize: 16,
                  color: 'var(--muted)',
                  userSelect: 'none'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </span>

            </div>

          </div>


          {/* Error Message */}

          {error && (

            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              color: '#f87171',
              marginBottom: 16,
            }}>
              {error}
            </div>

          )}


          {/* Submit Button */}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '11px',
              background: loading ? '#1e3a5f' : '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

        </form>


        {/* Default Credentials */}

        <div style={{
          marginTop: 24,
          padding: '14px',
          background: 'var(--bg)',
          borderRadius: 8,
          border: '1px solid var(--border)',
          fontSize: 12,
          color: 'var(--muted)',
        }}>

          <div style={{
            fontWeight: 600,
            marginBottom: 6,
            color: 'var(--text)'
          }}>
            Default accounts:
          </div>

          <div>
            Admin:
            <code style={{ color: 'var(--accent2)' }}> admin </code>
            /
            <code style={{ color: 'var(--accent2)' }}> admin123 </code>
          </div>

        </div>

      </div>

    </div>
  );
}