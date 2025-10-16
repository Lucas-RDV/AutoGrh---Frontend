import './App.css';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

// Guard
import RequireAuth from './routes/RequireAuth';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import NavBar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';

// Pages
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Pagamentos from './pages/Pagamentos/Pagamentos';
import Funcionarios from './pages/Funcionarios/Funcionarios';
import FuncionarioDetail from './pages/Funcionarios/FuncionarioDetail';
import FuncionarioCreate from './pages/Funcionarios/FuncionarioCreate';
import Admin from './pages/Admin/Admin';
import Usuarios from './pages/Admin/Usuarios';
import Logs from './pages/Admin/Logs';
import FolhaSection from './pages/Pagamentos/FolhaSection';
import ValesSection from './pages/Pagamentos/ValesSection';

function LoginRoute() {
  const { isLoggedIn } = useAuth();
  const location = useLocation();

  if (isLoggedIn) {
    const to = location.state?.from?.pathname || '/home';
    return <Navigate to={to} replace />;
  }
  return <Login />;
}

function RequireAdmin({ children }) {
  const { user } = useAuth();
  if (!user?.isAdmin) {
    return <Navigate to="/home" replace />;
  }
  return children;
}

function AppContent() {
  const { isBooting } = useAuth();
  if (isBooting) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 240 }}>
        <div className="text-muted">Verificando sessão…</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Rota pública */}
      <Route path="/login" element={<LoginRoute />} />

      {/* Rotas privadas */}
      <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />

      {/* Área Admin */}
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <RequireAdmin>
              <Admin />
            </RequireAdmin>
          </RequireAuth>
        }
      >
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="logs" element={<Logs />} />
      </Route>

      {/* Pagamentos */}
      <Route path="/pagamentos" element={<RequireAuth><Pagamentos /></RequireAuth>}>
        <Route index element={<Navigate to="folha" replace />} />
        <Route path="folha" element={<FolhaSection />} />
        <Route path="vales" element={<ValesSection />} />
      </Route>

      {/* Funcionários */}
      <Route path="/funcionarios" element={<RequireAuth><Funcionarios /></RequireAuth>} />
      <Route path="/funcionarios/novo" element={<RequireAuth><FuncionarioCreate /></RequireAuth>} />
      <Route path="/funcionarios/:id" element={<RequireAuth><FuncionarioDetail /></RequireAuth>} />

      {/* Defaults */}
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="d-flex flex-column min-vh-100">
          <NavBar />
          <div className="flex-fill container py-3">
            <AppContent />
          </div>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
