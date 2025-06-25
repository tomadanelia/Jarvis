import { Link, useNavigate } from 'react-router-dom';
import { useSimulationStore } from '../store/simulationStore';

/**
 * A navigation bar that displays different links based on user authentication status.
 */
export default function Navbar() {
  const { user, logout } = useSimulationStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">Robot Simulation</Link>
      </div>
      <div className="nav-links">
        {user ? (
          <>
            <span className="nav-user-email">{user.email}</span>
            <button onClick={handleLogout} className="nav-button">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">
              Login
            </Link>
            <Link to="/signup" className="nav-link">
              Signup
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}