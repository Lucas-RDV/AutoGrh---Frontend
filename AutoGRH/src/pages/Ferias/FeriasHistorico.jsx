import { useEffect, useState } from 'react';

const FeriasHistorico = () => {
  const [historico, setHistorico] = useState([]);

  useEffect(() => {
    // Simulação de dados históricos de descanso 
    const dadosMock = [
      {
        id: 1,
        nome: 'João Silva',
        dataInicio: '2024-01-10',
        dataFim: '2024-01-20',
        dias: 10,
      },
      {
        id: 2,
        nome: 'Maria Oliveira',
        dataInicio: '2023-12-01',
        dataFim: '2023-12-15',
        dias: 15,
      },
    ];
    setHistorico(dadosMock);
  }, []);

  return (
    <>
      <h5 className="mb-4">Histórico de Férias</h5>
      <table className="table table-hover">
        <thead>
          <tr>
            <th>Funcionário</th>
            <th>Início</th>
            <th>Fim</th>
            <th>Duração</th>
          </tr>
        </thead>
        <tbody>
          {historico.map((item) => (
            <tr key={item.id}>
              <td>{item.nome}</td>
              <td>{item.dataInicio}</td>
              <td>{item.dataFim}</td>
              <td>{item.dias} dias</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default FeriasHistorico;