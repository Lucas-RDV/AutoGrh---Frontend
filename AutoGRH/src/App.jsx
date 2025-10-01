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
import Ferias from './pages/Ferias/Ferias';
import FeriasPendentes from './pages/Ferias/FeriasPendentes';
import FeriasHistorico from './pages/Ferias/FeriasHistorico';
import FeriasDisponiveis from './pages/Ferias/FeriasDisponiveis';
import Funcionarios from './pages/Funcionarios/Funcionarios';

function LoginRoute() {
  const { isLoggedIn } = useAuth();
  const location = useLocation();

  if (isLoggedIn) {
    // se veio de uma rota protegida, volta pra lá; senão vai pra /home
    const to = location.state?.from?.pathname || '/home';
    return <Navigate to={to} replace />;
  }
  return <Login />;
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
      <Route path="/pagamentos" element={<RequireAuth><Pagamentos /></RequireAuth>} />
      <Route path="/funcionarios" element={<RequireAuth><Funcionarios /></RequireAuth>} />

      {/* Férias com subrotas protegidas */}
      <Route path="/ferias" element={<RequireAuth><Ferias /></RequireAuth>}>
        <Route path="pendentes" element={<FeriasPendentes />} />
        <Route path="historico" element={<FeriasHistorico />} />
        <Route path="disponiveis" element={<FeriasDisponiveis />} />
      </Route>

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
