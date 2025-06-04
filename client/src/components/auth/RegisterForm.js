import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RegisterForm = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // const [role, setRole] = useState('user'); // Default role
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // await register(username, email, password, role);
      await register(username, email, password); // Role might be set on server or not exposed here
      navigate('/dashboard'); // Or to login page for them to login
    } catch (err) {
      setError(err.response?.data?.message || 'שגיאה בהרשמה. נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="error-message">{error}</p>}
      <div>
        <label htmlFor="username">שם משתמש:</label>
        <input
          data-testid="username"
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="email">אימייל:</label>
        <input
          data-testid="email"
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="password">סיסמה:</label>
        <input
          data-testid="password"
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="confirmPassword">אימות סיסמה:</label>
        <input
          data-testid="confirmPassword"
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      {/* Optional: Role selection if allowed during registration
      <div>
        <label htmlFor="role">תפקיד:</label>
        <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="user">משתמש</option>
          <option value="manager">מנהל</option>
        </select>
      </div>
      */}
      <button type="submit" disabled={loading}>
        {loading ? 'רושם...' : 'הירשם'}
      </button>
    </form>
  );
};

export default RegisterForm;