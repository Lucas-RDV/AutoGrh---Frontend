import { Link, useLocation, useNavigate } from 'react-router-dom';
import styles from './Navbar.module.css';
import logo from '/AutoGRH.svg';

const NavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    { path: '/', label: 'Início' },
    { path: '/funcionarios', label: 'Funcionários' },
    { path: '/pagamentos', label: 'Pagamentos' },
    { path: '/ferias', label: 'Férias' },
  ];

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.leftSection}>
        <img src={logo} alt="AutoGRH Logo" className={styles.logo} />
        <span className={styles.title}>AutoGRH</span>
      </div>

      {location.pathname !== '/login' && (
        <div className={styles.rightSection}>
          <ul className={styles.navbarLinks}>
            {links.map(({ path, label }) => (
              <li
                key={path}
                className={location.pathname === path ? styles.active : ''}
              >
                <Link to={path}>{label}</Link>
              </li>
            ))}
          </ul>

          <button className={styles.logoutButton} onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
