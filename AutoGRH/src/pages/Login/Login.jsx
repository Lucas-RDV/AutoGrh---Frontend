import FormLogin from '../../components/formLogin/FormLogin';

const Login = () => {
  return (
    <div className="flex-fill d-flex justify-content-center align-items-center bg-light">
      <div className="text-center">
        <h1 className="mb-4">Login</h1>
        <FormLogin />
      </div>
    </div>
  );
};

export default Login;
