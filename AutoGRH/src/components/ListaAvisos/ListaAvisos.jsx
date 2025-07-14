import styles from './ListaAvisos.module.css';

const ListaAvisos = () => {
  return (
    <div className={styles.avisos}>
      <h2>Avisos</h2>
      <ul className={styles.listaAvisos}>
        <li className={styles.avisoVazio}>Nenhum aviso disponível no momento.</li>
      </ul>
    </div>
  );
};

export default ListaAvisos;
