import { useEffect, useState } from 'react';

const FeriasDisponiveis = () => {
  const [ferias, setFerias] = useState([]);

  useEffect(() => {
    const mock = [
      { nome: 'Maria Oliveira', diasDisponiveis: 20 },
      { nome: 'Carlos Souza', diasDisponiveis: 15 },
      { nome: 'Ana Paula', diasDisponiveis: 30 },
    ];
    setFerias(mock);
  }, []);

  return (
    <div>
      <h2 className="mb-3">Saldo de Férias</h2>
      <table className="table table-hover">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Dias disponíveis</th>
          </tr>
        </thead>
        <tbody>
          {ferias.map((item, index) => (
            <tr key={index}>
              <td>{item.nome}</td>
              <td>{item.diasDisponiveis}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FeriasDisponiveis;
