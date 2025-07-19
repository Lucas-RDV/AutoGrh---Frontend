import { APP_VERSION } from '../../version';

const Footer = () => {
  return (
    <footer className="bg-light text-center py-1 border-top mt-auto">
      <div className="container">
        <span className="d-block text-muted small">AutoGRH © 2025 – Desenvolvido por Lucas Ribeiro Dal Vesco</span>
        <span className="d-block text-muted small">Versão {APP_VERSION}</span>
      </div>
    </footer>
  );
};

export default Footer;
