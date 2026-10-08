import { useContext, useEffect, useState } from 'react';
import { AuthContext } from './context/AuthContext';
import { AuthProvider } from './context/AuthProvider';
import Login from './components/Login';
import Register from './components/Register';
import DashboardTemplate from './components/DashboardTemplate';
import ClientDashboard from './components/client/ClientDashboard'; 
import DeliveryDashboard from './components/DeliveryDashboard';

const routes = {
  login: '#/login',
  register: '#/register',
  dashboard: '#/dashboard',
  clients: '#/admin/clientes',
  couriers: '#/admin/repartidores',
  clientView: '#/vista/cliente',
  courierView: '#/vista/repartidor/',
};

const getCurrentRoute = () => window.location.hash || routes.dashboard;

function MainApp() {
  const { user, logout } = useContext(AuthContext);
  const [currentRoute, setCurrentRoute] = useState(getCurrentRoute);

  useEffect(() => {
    const updateRoute = () => setCurrentRoute(getCurrentRoute());

    window.addEventListener('hashchange', updateRoute);
    return () => window.removeEventListener('hashchange', updateRoute);
  }, []);

  useEffect(() => {
    if (
      !user &&
      currentRoute !== routes.login &&
      currentRoute !== routes.register
    ) {
      window.location.hash = routes.login;
    }
  }, [user, currentRoute]);

  const navigate = (route) => {
    if (window.location.hash === route) {
      setCurrentRoute(route);
      return;
    }

    window.location.hash = route;
  };

  if (!user) {
    if (currentRoute === routes.register) {
      return <Register />;
    }
    return <Login />;
  }

  const role = (user.role || user.rol || '').toUpperCase();

  if (role === 'CLIENT') {
    return <ClientDashboard />;
  }

  if (role === 'DELIVERY') {
    return <DeliveryDashboard />;
  }

  if (role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-center text-white">
        <div>
          <h1 className="text-2xl font-black">Sin acceso</h1>
          <p className="mt-2 text-sm text-slate-400">Tu cuenta no tiene permisos para este panel.</p>
          <button type="button" onClick={logout} className="mt-6 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold hover:bg-emerald-500">
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  if (currentRoute === routes.clientView) {
    return <ClientDashboard onBack={() => navigate(routes.clients)} />;
  }

  if (currentRoute.startsWith(routes.courierView)) {
    const courierId = currentRoute.slice(routes.courierView.length);
    return <DeliveryDashboard key={courierId} courierId={courierId} onBack={() => navigate(routes.couriers)} />;
  }

  return (
    <DashboardTemplate
      currentRoute={currentRoute}
      onNavigate={navigate}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
