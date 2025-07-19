import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="d-flex flex-column min-vh-100">
          <NavBar />

          <main className="flex-fill d-flex flex-column">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/home" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/pagamentos" element={<Pagamentos />} />
              <Route path="/ferias" element={<Ferias />} />
              <Route path="/funcionarios" element={<Funcionarios />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
