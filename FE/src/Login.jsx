import { useState } from 'react';
import './Login.css';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email === 'admin@admin.se' && password === 'admin123') {
      setError('');
      onLogin();
    } else {
      setError('Fel användarnamn eller lösenord');
    }
  };
//en vanlig kommentar
  return (
    <div className="login-modal-bg">
      <div className="login-modal">
        <form onSubmit={handleSubmit} className="login-form">
          <h2>Admin Login</h2>
          <div className="login-input-group">
            <input
              type="email"
              placeholder="E-post"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="login-input"
              autoFocus
            />
          </div>
          <div className="login-input-group">
            <input
              type="password"
              placeholder="Lösenord"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="login-input"
            />
          </div>
          <button type="submit" className="login-btn">Logga in</button>
          {error && <div className="login-error">{error}</div>}
        </form>
      </div>
    </div>
  );
}
