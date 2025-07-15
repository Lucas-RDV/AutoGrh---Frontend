import { useState, useEffect } from 'react';
import styles from './Home.module.css';
import { useAuth } from '../../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [avisos, setAvisos] = useState([]);

  useEffect(() => {
    // executa ao carregar a pagina
    const avisosMock = Array.from({ length: 15 }, (_, i) => ({
      texto: `Aviso ${i + 1}`,
      data: '10/07/2025',
    }));
    setAvisos(avisosMock);
  }, []);

  const handleFolhaPagamento = () => {
    alert('Função não implementada');
  };

  const handleRequisicaoVale = () => {
    alert('Função não implementada');
  };

  const handleRequisicaoFerias = () => {
    alert('Função não implementada');
  };

  const handleCadastroFuncionario = () => {
    alert('Função não implementada');
  };

  const totalLinhas = 7;
  const linhasExtras = totalLinhas - avisos.length;

  return (
    <div className={styles.container}>
      <div className={styles.menuAvisosContainer}>
        <div className={styles.menuCard}>
       <div className={styles.usuarioLogado}>{user?.username || 'teste'}</div>
          <h2 className={styles.menuTitulo}>Acesso Rápido</h2>
          <button className={styles.menuButton} onClick={handleFolhaPagamento}>Gerar folha de pagamento</button>
          <button className={styles.menuButton} onClick={handleRequisicaoVale}>requisição de vale</button>
          <button className={styles.menuButton} onClick={handleRequisicaoFerias}>Requisição de ferias</button>
          <button className={styles.menuButton} onClick={handleCadastroFuncionario}>Cadastrar novo funcionário</button>
        </div>

        <div className={styles.avisosCard}>
          <div className={styles.avisosHeader}>Avisos</div>
          <div className={styles.avisosTableContainer}>
            <table className={styles.avisosTable}>
              <tbody>
                {avisos.map((aviso, index) => (
                  <tr key={index}>
                    <td className={styles.msgCol}>{aviso.texto}</td>
                    <td className={styles.dateCol}>{aviso.data}</td>
                  </tr>
                ))}
                {Array.from({ length: linhasExtras > 0 ? linhasExtras : 0 }).map((_, i) => (
                  <tr key={`vazio-${i}`}>
                    <td className={styles.msgCol}>&nbsp;</td>
                    <td className={styles.dateCol}></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
