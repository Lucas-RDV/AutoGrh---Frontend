import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

// Contexts
import { AuthProvider } from './context/AuthContext'

// Components
import NavBar from './components/Navbar/Navbar'
import Footer from './components/Footer/Footer'

// Pages
import Home from './pages/Home/Home'
import Login from './pages/Login/Login'
import Pagamentos from './pages/Pagamentos/Pagamentos'
import Ferias from './pages/Ferias/Ferias'
import Funcionarios from './pages/Funcionarios/Funcionarios'

function App() {

  return (
    <AuthProvider>
      <BrowserRouter>
      <div className="app">
        <NavBar />
        <div>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/pagamentos" element={<Pagamentos />} />
            <Route path="/ferias" element={<Ferias />} />
            <Route path="/funcionarios" element={<Funcionarios />} />
          </Routes>
        </div>
        <Footer/>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
