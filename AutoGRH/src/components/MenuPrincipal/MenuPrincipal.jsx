import styles from './MenuPrincipal.module.css';

const MenuPrincipal = () => {
  const cadastrarFuncionario = () => {
    alert('Esta função ainda não foi implementada');
  };

  const requisitarVale = () => {
    alert('Esta função ainda não foi implementada');
  };

  const requisitarFerias = () => {
    alert('Esta função ainda não foi implementada');
  };

  const gerarFolhaPagamento = () => {
    alert('Esta função ainda não foi implementada');
  };

  return (
    <div className={styles.menuPrincipal}>
      <button onClick={cadastrarFuncionario}>Cadastrar novo funcionário</button>
      <button onClick={requisitarVale}>Requisitar vale</button>
      <button onClick={requisitarFerias}>Requisitar férias</button>
      <button onClick={gerarFolhaPagamento}>Gerar folha de pagamento</button>
    </div>
  );
};

export default MenuPrincipal;
