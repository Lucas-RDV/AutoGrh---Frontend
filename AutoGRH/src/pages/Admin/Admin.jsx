import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';

const Admin = () => {
  const location = useLocation();
  const atRoot = location.pathname === '/admin';

  if (atRoot) {
    return <Navigate to="/admin/usuarios" replace />;
  }

  return (
    <div className="row g-3">
      <div className="col-12">
        <div className="card shadow-sm">
          <div className="card-body">
            <h5 className="card-title mb-3">Área Administrativa</h5>

            <ul className="nav nav-pills">
              <li className="nav-item">
                <NavLink
                  to="/admin/usuarios"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  Usuários
                </NavLink>
              </li>
              <li className="nav-item ms-2">
                <NavLink
                  to="/admin/logs"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  Logs
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="col-12">
        <Outlet />
      </div>
    </div>
  );
};

export default Admin;
