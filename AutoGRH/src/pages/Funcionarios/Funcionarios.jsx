import { useState, useEffect } from 'react';
import styles from './Funcionarios.module.css';

const Funcionarios = () => {
  const [funcionarios, setFuncionarios] = useState([]);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    const mock = [
      { Id: 1, Nome: 'Maria Oliveira', Cargo: 'Analista RH' },
      { Id: 2, Nome: 'Carlos Souza', Cargo: 'Assistente Administrativo' },
      { Id: 3, Nome: 'Ana Paula', Cargo: 'Gerente Financeiro' },
    ];
    setFuncionarios(mock);
  }, []);

  const handleEditar = (nome) => alert(`Editar dados de ${nome}`);
  const handleDocumento = (nome) => alert(`Adicionar documento para ${nome}`);
  const handleFalta = (nome) => alert(`Adicionar falta para ${nome}`);
  const handleExcluir = (nome) => alert(`Excluir ${nome}`);

  const funcionariosFiltrados = funcionarios.filter(func =>
    func.Nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="flex-fill d-flex flex-column gap-4 p-4">
      <h2 className="mb-3">Funcionários</h2>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <input
          type="text"
          className="form-control w-50"
          placeholder="Pesquisar por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <button className="btn btn-outline-primary">
          Cadastrar novo funcionário
        </button>
      </div>

      <table className={`table table-hover ${styles.tabelaFuncionarios}`}>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Cargo</th>
            <th className="text-end">Ações</th>
          </tr>
        </thead>
        <tbody>
          {funcionariosFiltrados.map((func, index) => (
            <tr key={func.Id || index}>
              <td>{func.Nome}</td>
              <td>{func.Cargo}</td>
              <td className="text-end d-flex justify-content-end gap-2">
                <button className="btn btn-sm btn-outline-secondary" onClick={() => handleEditar(func.Nome)}>Editar</button>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => handleDocumento(func.Nome)}>Documento</button>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => handleFalta(func.Nome)}>Falta</button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => handleExcluir(func.Nome)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Funcionarios;
