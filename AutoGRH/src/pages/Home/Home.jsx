import styles from './Home.module.css';
import { useAuth } from '../../context/AuthContext';
import MenuPrincipal from '../../components/MenuPrincipal/MenuPrincipal';
import ListaAvisos from '../../components/ListaAvisos/ListaAvisos';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className={styles.container}>
      <p className={styles.username}>Usuário logado: {user?.username}</p>

      <div className={styles.conteudo}>
        <MenuPrincipal />
        <ListaAvisos />
      </div>
    </div>
  );
};

export default Home;
