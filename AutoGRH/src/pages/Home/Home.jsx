import { useState, useEffect } from 'react';
import styles from './Home.module.css';
import MenuLateral from '../../components/MenuLateral/MenuLateral';

const Home = () => {
  const [avisos, setAvisos] = useState([]);

  useEffect(() => {
    const avisosMock = Array.from({ length: 30 }, (_, i) => ({
      texto: `Aviso ${i + 1}`,
      data: '10/07/2025',
    }));
    setAvisos(avisosMock);
  }, []);

  return (
    <div className="flex-fill d-flex flex-row gap-4 p-4">
      {/* Menu lateral */}
      <MenuLateral page={"home"}/>

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
