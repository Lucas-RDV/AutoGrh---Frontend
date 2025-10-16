import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '/AutoGRH.svg';

const NavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, isLoggedIn, user } = useAuth();

  const links = [
    { path: '/home', label: 'Início' },
    { path: '/funcionarios', label: 'Funcionários' },
    { path: '/pagamentos', label: 'Pagamentos' },
  ];

  const isActive = (path) => {
    if (path === '/' && (location.pathname === '/' || location.pathname === '/home')) return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleLogout = () => {
    logout();                           // limpa token e user (AuthContext + localStorage)
    navigate('/login', { replace: true });
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom px-3">
      <div className="d-flex align-items-center">
        <img src={logo} alt="AutoGRH Logo" style={{ height: '40px', marginRight: '10px' }} />
        <span className="navbar-brand mb-0 h1">AutoGRH</span>
      </div>

      {location.pathname !== '/login' && (
        <div className="ms-auto d-flex align-items-center">
          <ul className="navbar-nav me-3">
            {links.map(({ path, label }) => (
              <li key={path} className="nav-item">
                <Link
                  to={path}
                  className={`nav-link ${isActive(path) ? 'active fw-bold text-primary' : ''}`}
                >
                  {label}
                </Link>
              </li>
            ))}
            {user?.isAdmin && (
      <li className="nav-item">
        <Link
          to="/admin"
          className={`nav-link ${isActive('/admin') ? 'active fw-bold text-primary' : ''}`}
        >
          Admin
        </Link>
      </li>
    )}
          </ul>

          <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
