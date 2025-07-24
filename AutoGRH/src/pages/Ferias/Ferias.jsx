import { Outlet } from 'react-router-dom';
import MenuLateral from '../../components/MenuLateral/MenuLateral';

const Ferias = () => {
  return (
    <div className="flex-fill d-flex flex-row gap-4 p-4">
      <MenuLateral page="ferias" />

      <div className="flex-grow-1 flex-column bg-white p-3 shadow-sm">
        <Outlet />
      </div>
    </div>
  );
};

export default Ferias;
