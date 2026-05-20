import { useEffect } from 'react';
import { useApp } from './context/AppContext';
import { SupabaseService } from './services/SupabaseService';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { Loader } from './components/Loader';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SupervisorHomeScreen } from './components/SupervisorHomeScreen';
import { AlistadorJoinScreen } from './components/AlistadorJoinScreen';
import { SupervisorDashboard } from './components/SupervisorDashboard';
import { CityListScreen } from './components/CityListScreen';
import { PickListScreen } from './components/PickListScreen';
import { SummaryScreen } from './components/SummaryScreen';

/**
 * App - Controlador principal
 * Orquesta navegación y suscripción a realtime
 */
export function App() {
  const {
    screen,
    setScreen,
    role,
    session,
    setItems,
    resetApp,
    setIsOnline,
  } = useApp();

  // Verificación periódica de conexión
  useEffect(() => {
    const check = async () => {
      const ok = await SupabaseService.checkConnection();
      setIsOnline(ok);
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [setIsOnline]);

  // Suscripción a realtime cuando hay sesión activa
  useEffect(() => {
    if (!session) return;

    const unsubscribe = SupabaseService.subscribeToSession(
      session.id,
      (updatedItem) => {
        setItems((prev) =>
          prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
        );
      },
      (newItem) => {
        setItems((prev) => [...prev, newItem]);
      }
    );

    return unsubscribe;
  }, [session, setItems]);

  // Determinar título del header
  const getTitle = () => {
    if (screen === 'welcome') return '📦 Alistamiento';
    if (role === 'supervisor') return '👔 Supervisor';
    return '👷 Alistador';
  };

  // Navegación back
  const handleBack = () => {
    if (screen === 'superHome' || screen === 'alistadorJoin') {
      resetApp();
    } else if (screen === 'superDash') {
      setScreen('superHome');
    } else if (screen === 'cities') {
      if (role === 'supervisor') setScreen('superDash');
      else resetApp();
    } else if (screen === 'picking') {
      setScreen('cities');
    } else if (screen === 'summary') {
      if (role === 'supervisor') setScreen('superDash');
      else setScreen('cities');
    }
  };

  const showBack = screen !== 'welcome';
  const showProgress = !!session && screen !== 'welcome';

  const renderScreen = () => {
    switch (screen) {
      case 'welcome':
        return <WelcomeScreen />;
      case 'superHome':
        return <SupervisorHomeScreen />;
      case 'alistadorJoin':
        return <AlistadorJoinScreen />;
      case 'superDash':
        return <SupervisorDashboard />;
      case 'cities':
        return <CityListScreen />;
      case 'picking':
        return <PickListScreen />;
      case 'summary':
        return <SummaryScreen />;
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <>
      <Header
        title={getTitle()}
        onBack={showBack ? handleBack : undefined}
        showProgress={showProgress}
      />
      <main>{renderScreen()}</main>
      <Toast />
      <Loader />
    </>
  );
}
