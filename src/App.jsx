import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import { AuthProvider } from './context/AuthProvider';
import Login from './components/Login';
import DashboardTemplate from './components/DashboardTemplate';
import ClientDashboard from './components/client/ClientDashboard'; 
import DeliveryDashboard from './components/DeliveryDashboard';

function MainApp() {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Login />;
  }
  if (user.role === 'CLIENT' || user.rol === 'CLIENT' || user.role === 'client') {
    return <ClientDashboard />;
  }
  if (user.role === 'DELIVERY' || user.rol === 'DELIVERY' || user.role === 'delivery') {
    return <DeliveryDashboard />;
  }

  return <DashboardTemplate />;
}
  

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}