import { useAuth } from '../../context/AuthContext';
import styles from './MenuLateral.module.css';
import { useNavigate } from 'react-router-dom';

const MenuLateral = ({ page }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleFolhaPagamento = () => alert('Função não implementada');
  const handleRequisicaoVale = () => alert('Função não implementada');
  const handleRequisicaoFerias = () => alert('Função não implementada');
  const handleCadastroFuncionario = () => alert('Função não implementada');
  const handleAprovarVales = () => alert('Função não implementada');
  const handleHistoricoFolhas = () => alert('Função não implementada');

  const todosBotoes = [
    {
      label: 'Gerar folha de pagamento',
      onClick: handleFolhaPagamento,
      pages: ['home', 'pagamentos'],
    },
    {
      label: 'Requisição de vale',
      onClick: handleRequisicaoVale,
      pages: ['home', 'pagamentos'],
    },
    {
      label: 'Requisitar férias',
      onClick: handleRequisicaoFerias,
      pages: ['home', 'ferias'],
    },
    {
      label: 'Cadastrar novo funcionário',
      onClick: handleCadastroFuncionario,
      pages: ['home', 'funcionarios'],
    },
    {
      label: 'Visualizar férias disponíveis',
      onClick: () => navigate('/ferias/disponiveis'),
      pages: ['ferias'],
    },
    {
      label: 'Histórico de férias',
      onClick: () => navigate('/ferias/historico'),
      pages: ['ferias'],
    },
    {
      label: 'Solicitações pendentes de férias',
      onClick: () => navigate('/ferias/pendentes'),
      pages: ['ferias'],
    },
    {
      label: 'Aprovar vales',
      onClick: handleAprovarVales,
      pages: ['pagamentos'],
    },
    {
      label: 'Histórico de folhas de pagamento',
      onClick: handleHistoricoFolhas,
      pages: ['pagamentos'],
    },
  ];

  return (
    <div className={`bg-light p-3 shadow-sm ${styles.menuLateral}`}>
      <div className="text-muted small mb-3">{user?.username || 'teste'}</div>
      <h5 className="mb-3">Acesso Rápido</h5>
      <div className="d-grid gap-2">
        {todosBotoes
          .filter((botao) => botao.pages.includes(page))
          .map((botao, index) => (
            <button key={index} className="btn btn-primary" onClick={botao.onClick}>
              {botao.label}
            </button>
          ))}
      </div>
    </div>
  );
};

export default MenuLateral;
