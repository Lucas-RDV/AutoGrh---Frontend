import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './Home.module.css';

const Home = () => {
  const { user } = useAuth();
  const [avisos, setAvisos] = useState([]);

  useEffect(() => {
    const avisosMock = Array.from({ length: 30 }, (_, i) => ({
      texto: `Aviso ${i + 1}`,
      data: '10/07/2025',
    }));
    setAvisos(avisosMock);
  }, []);

  const handleFolhaPagamento = () => alert('Função não implementada');
  const handleRequisicaoVale = () => alert('Função não implementada');
  const handleRequisicaoFerias = () => alert('Função não implementada');
  const handleCadastroFuncionario = () => alert('Função não implementada');

  return (
    <div className="flex-fill d-flex flex-row gap-4 p-4">
      {/* Menu lateral */}
      <div
  className="bg-light p-3 shadow-sm"
  style={{
    minWidth: '280px',
    position: 'sticky',
    top: 0,
    alignSelf: 'flex-start',
    height: 'fit-content',
    zIndex: 1020 // evita ser coberto por tabela com sticky
  }}
>
  <div className="text-muted small mb-3">{user?.username || 'teste'}</div>
  <h5 className="mb-3">Acesso Rápido</h5>
  <div className="d-grid gap-2">
    <button className="btn btn-primary" onClick={handleFolhaPagamento}>Gerar folha de pagamento</button>
    <button className="btn btn-primary" onClick={handleRequisicaoVale}>Requisição de vale</button>
    <button className="btn btn-primary" onClick={handleRequisicaoFerias}>Requisição de férias</button>
    <button className="btn btn-primary" onClick={handleCadastroFuncionario}>Cadastrar novo funcionário</button>
  </div>
</div>

      {/* Avisos */}
      <div className="flex-grow-1 flex-column bg-white p-3 shadow-sm">
        <div className={styles.avisosTitulo}>Avisos</div>
        <div className="flex-grow-1 overflow-auto">
          <table className={`table table-hover table-responsive overflow-auto ${styles.avisosTabela}`}>
            <tbody>
              {avisos.map((aviso, index) => (
                <tr key={index}>
                  <td className="w-75">{aviso.texto}</td>
                  <td className="w-25 text-end text-muted">{aviso.data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Home
