import { useState, useEffect } from 'react';
import MenuLateral from '../../components/MenuLateral/MenuLateral';

const Pagamentos = () => {
  const [folhas, setFolhas] = useState([]);

  useEffect(() => {
    const mock = [
      {
        id: 1,
        nome: 'João Silva',
        mes: 'Junho/2025',
        valor: 'R$ 3.500,00',
      },
      {
        id: 2,
        nome: 'Maria Oliveira',
        mes: 'Junho/2025',
        valor: 'R$ 4.100,00',
      },
    ];
    setFolhas(mock);
  }, []);

  return (
    <div className="flex-fill d-flex flex-row gap-4 p-4">
      {/* Menu lateral */}
      <MenuLateral page="pagamentos" />

      {/* Conteúdo principal */}
      <div className="flex-grow-1 flex-column bg-white p-3 shadow-sm">
        <h5 className="mb-4">Últimas folhas de pagamento</h5>

        <table className="table table-hover">
          <thead className="table-light">
            <tr>
              <th>Funcionário</th>
              <th>Mês</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {folhas.map((folha) => (
              <tr key={folha.id}>
                <td>{folha.nome}</td>
                <td>{folha.mes}</td>
                <td>{folha.valor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Pagamentos;
