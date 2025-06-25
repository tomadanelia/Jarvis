import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { signupApi } from '../services/apiService';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const response = await signupApi({ email, password });

      // FIX: Use optional chaining (?.) to safely access nested properties.
      if (response?.data?.user && !response.data.session) {
        setMessage('Signup successful! Please check your email for the confirmation link.');
      } else if (response?.data?.user && response.data.session) {
        setMessage('Signup successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        // This handles unexpected successful responses that don't match the expected structure.
        setError('An unexpected response was received from the server.');
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred during signup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Sign Up</h2>
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading || !!message}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
            disabled={loading || !!message}
          />
        </div>
        <button type="submit" disabled={loading || !!message}>
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
}