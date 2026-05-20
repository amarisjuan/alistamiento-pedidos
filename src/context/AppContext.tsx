import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type {
  Item,
  Session,
  Screen,
  UserRole,
  ToastState,
  FilterType,
} from '../models/types';

interface AppContextType {
  // Estado
  role: UserRole;
  setRole: (role: UserRole) => void;
  alistadorName: string;
  setAlistadorName: (name: string) => void;
  session: Session | null;
  setSession: (session: Session | null) => void;
  items: Item[];
  setItems: (items: Item[] | ((prev: Item[]) => Item[])) => void;
  screen: Screen;
  setScreen: (screen: Screen) => void;
  currentCity: string | null;
  setCurrentCity: (city: string | null) => void;
  currentFilter: FilterType;
  setCurrentFilter: (filter: FilterType) => void;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;

  // Toast
  toast: ToastState;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;

  // Loader
  loading: boolean;
  loaderText: string;
  showLoader: (text?: string) => void;
  hideLoader: () => void;

  // Reset
  resetApp: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(null);
  const [alistadorName, setAlistadorName] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [screen, setScreen] = useState<Screen>('welcome');
  const [currentCity, setCurrentCity] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('pendientes');
  const [isOnline, setIsOnline] = useState(true);

  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    visible: false,
  });

  const [loading, setLoading] = useState(false);
  const [loaderText, setLoaderText] = useState('Cargando...');

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      setToast({ message, type, visible: true });
      setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 2200);
    },
    []
  );

  const showLoader = useCallback((text: string = 'Cargando...') => {
    setLoaderText(text);
    setLoading(true);
  }, []);

  const hideLoader = useCallback(() => {
    setLoading(false);
  }, []);

  const resetApp = useCallback(() => {
    setRole(null);
    setSession(null);
    setItems([]);
    setScreen('welcome');
    setCurrentCity(null);
    setCurrentFilter('pendientes');
  }, []);

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        alistadorName,
        setAlistadorName,
        session,
        setSession,
        items,
        setItems,
        screen,
        setScreen,
        currentCity,
        setCurrentCity,
        currentFilter,
        setCurrentFilter,
        isOnline,
        setIsOnline,
        toast,
        showToast,
        loading,
        loaderText,
        showLoader,
        hideLoader,
        resetApp,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider');
  return ctx;
}
