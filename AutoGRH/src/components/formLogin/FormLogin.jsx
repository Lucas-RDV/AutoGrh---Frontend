import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FormLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Placeholder
    navigate('/home');
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded bg-white shadow-sm w-100" style={{ maxWidth: '400px', margin: '0 auto' }}>
      <div className="mb-3">
        <label htmlFor="username" className="form-label">Usuário</label>
        <input
          type="text"
          id="username"
          className="form-control"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>

      <div className="mb-3">
        <label htmlFor="password" className="form-label">Senha</label>
        <input
          type="password"
          id="password"
          className="form-control"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <button type="submit" className="btn btn-primary w-100">
        Entrar
      </button>
    </form>
  );
};

export default FormLogin;
