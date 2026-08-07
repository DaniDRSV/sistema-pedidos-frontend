import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import { AuthProvider } from './context/AuthProvider';
import Login from './components/Login';
import DashboardTemplate from './components/DashboardTemplate';

function MainApp() {
  const { user } = useContext(AuthContext);

  return user ? <DashboardTemplate /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}