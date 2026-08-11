import { useContext, useEffect, useState } from 'react';
import { AuthContext } from './context/AuthContext';
import { AuthProvider } from './context/AuthProvider';
import Login from './components/Login';
import DashboardTemplate from './components/DashboardTemplate';
import ClientDashboard from './components/client/ClientDashboard'; 
import DeliveryDashboard from './components/DeliveryDashboard';

const routes = {
  dashboard: '#/dashboard',
  clients: '#/clientes',
  delivery: '#/repartidores',
};

const getCurrentRoute = () => window.location.hash || routes.dashboard;

function MainApp() {
  const { user } = useContext(AuthContext);
  const [currentRoute, setCurrentRoute] = useState(getCurrentRoute);

  useEffect(() => {
    const updateRoute = () => setCurrentRoute(getCurrentRoute());

    window.addEventListener('hashchange', updateRoute);
    return () => window.removeEventListener('hashchange', updateRoute);
  }, []);

  useEffect(() => {
    if (!user && currentRoute !== routes.dashboard) {
      window.location.hash = routes.dashboard;
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
    return <Login />;
  }

  const role = (user.role || user.rol || '').toUpperCase();

  if (role === 'CLIENT') {
    return <ClientDashboard />;
  }

  if (role === 'DELIVERY') {
    return <DeliveryDashboard />;
  }

  if (currentRoute === routes.clients) {
    return <ClientDashboard onBack={() => navigate(routes.dashboard)} />;
  }

  if (currentRoute === routes.delivery) {
    return <DeliveryDashboard onBack={() => navigate(routes.dashboard)} />;
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
