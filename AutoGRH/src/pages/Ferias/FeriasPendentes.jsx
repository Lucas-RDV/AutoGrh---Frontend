import { useEffect, useState } from 'react';

const FeriasPendentes = () => {
  const [pendentes, setPendentes] = useState([]);

  useEffect(() => {
    const mock = [
      { nome: 'Carlos Souza', dataInicio: '2025-08-01', dias: 10, status: 'Pendente' },
      { nome: 'Ana Paula', dataInicio: '2025-09-10', dias: 15, status: 'Pendente' },
    ];
    setPendentes(mock);
  }, []);

  return (
    <div>
      <h2 className="mb-3">Solicitações de Férias Pendentes</h2>
      <table className="table table-hover">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Data de início</th>
            <th>Dias solicitados</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {pendentes.map((item, index) => (
            <tr key={index}>
              <td>{item.nome}</td>
              <td>{item.dataInicio}</td>
              <td>{item.dias}</td>
              <td>{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FeriasPendentes;
