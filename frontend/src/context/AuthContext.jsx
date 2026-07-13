import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.verify(token)
        .then(r => {
          if (r.data.success) {
            setUser({ ...r.data.user, token });
          } else {
            localStorage.removeItem('token');
          }
        })
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const res = await authAPI.login({ username, password });
    if (res.data.success) {
      const userData = {
        token:     res.data.token,
        role:      res.data.role,
        ref_id:    res.data.ref_id,
        full_name: res.data.full_name,
        user_id:   res.data.user_id,
      };
      localStorage.setItem('token', userData.token);
      setUser(userData);
      return { success: true };
    }
    return { success: false, error: res.data.detail || 'Login failed' };
  };

  const logout = async () => {
    if (user?.token) {
      await authAPI.logout(user.token).catch(() => {});
    }
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);