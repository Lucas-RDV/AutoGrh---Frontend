import styles from './Footer.module.css';
import { APP_VERSION } from '../../version';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <span className={styles.text}>AutoGRH © 2025 – Desenvolvido por Lucas Ribeiro Dal Vesco</span>
      <span className={styles.version}>Versão {APP_VERSION}</span>
    </footer>
  );
};

export default Footer;
