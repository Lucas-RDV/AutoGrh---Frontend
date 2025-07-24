import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';

// Contexts
import { AuthProvider } from './context/AuthContext';

// Components
import NavBar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';

// Pages
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Pagamentos from './pages/Pagamentos/Pagamentos';
import Ferias from './pages/Ferias/Ferias';
import Funcionarios from './pages/Funcionarios/Funcionarios';
import FeriasHistorico from './pages/Ferias/FeriasHistorico';
import FeriasPendentes from './pages/Ferias/FeriasPendentes';
import FeriasDisponiveis from './pages/Ferias/FeriasDisponiveis';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="d-flex flex-column min-vh-100">
          <NavBar />

          <div className="container-fluid py-3 h-100">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/home" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/pagamentos" element={<Pagamentos />} />
              {/* Rotas para férias */}
              <Route path="/ferias" element={<Ferias />}>
              <Route index element={<Navigate to="disponiveis" replace />} />
                <Route path="historico" element={<FeriasHistorico />} />
                <Route path="pendentes" element={<FeriasPendentes />} />
                <Route path="disponiveis" element={<FeriasDisponiveis />} />
              </Route>
              <Route path="/funcionarios" element={<Funcionarios />} />
            </Routes>
          </div>

          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
