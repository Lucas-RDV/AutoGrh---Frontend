import styles from './Login.module.css';
import FormLogin from '../../components/formLogin/FormLogin';

const Login = () => {
  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>Login</h1>
        <FormLogin />
      </div>
    </div>
  );
};

export default Login;
