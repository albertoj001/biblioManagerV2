import { useEffect, useState } from 'react';
import { Home, BookOpen, ArrowRightLeft, ArrowLeftRight, Users, BarChart3, Settings, Moon, Sun } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from './components/ui/sidebar';
import { Topbar } from './components/Topbar';
import { Dashboard } from './components/Dashboard';
import { Catalog } from './components/Catalog';
import { Loans } from './components/Loans';
import { Returns } from './components/Returns';
import { UsersManagement } from './components/UsersManagement';
import { Reports } from './components/Reports';
import { Administration } from './components/Administration';
import { Login } from './components/Login';
import { api } from './lib/api';
import { toast } from 'sonner@2.0.3';
import { Toaster } from './components/ui/sonner';

export type View = 'dashboard' | 'catalog' | 'loans' | 'returns' | 'users' | 'reports' | 'administration';

const STORAGE_KEY = 'biblioManager_session';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.token && parsed?.user) {
          setIsAuthenticated(true);
          setCurrentUser(parsed.user);
          if (parsed.view) setCurrentView(parsed.view);
        }
      } catch {
        // ignore corrupted storage
      }
    }
  }, []);

  const menuItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: Home },
    { id: 'catalog' as View, label: 'Catálogo', icon: BookOpen },
    { id: 'loans' as View, label: 'Préstamos', icon: ArrowRightLeft },
    { id: 'returns' as View, label: 'Devoluciones', icon: ArrowLeftRight },
    { id: 'users' as View, label: 'Usuarios', icon: Users },
    { id: 'reports' as View, label: 'Reportes', icon: BarChart3 },
    { id: 'administration' as View, label: 'Administración', icon: Settings },
  ];

  const handleLogin = async (email: string, password: string) => {
    try {
      const res = await api.login({ email, password });
      const userData = { name: res.user.name, role: res.user.role };
      setIsAuthenticated(true);
      setCurrentUser(userData);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ token: res.token, user: userData, view: currentView })
      );
      toast.success(`Bienvenido, ${res.user.name}!`, {
        description: 'Has iniciado sesión correctamente',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión';
      toast.error('Credenciales incorrectas', {
        description: message,
      });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('dashboard');
    localStorage.removeItem(STORAGE_KEY);
    toast.info('Sesión cerrada', {
      description: 'Has cerrado sesión correctamente',
    });
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'catalog':
        return <Catalog />;
      case 'loans':
        return <Loans />;
      case 'returns':
        return <Returns />;
      case 'users':
        return <UsersManagement />;
      case 'reports':
        return <Reports />;
      case 'administration':
        return <Administration />;
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <Login onLogin={handleLogin} />
        <Toaster />
      </div>
    );
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <SidebarProvider>
          <div className="flex h-screen w-full">
            {/* Sidebar */}
            <Sidebar className="border-r border-gray-200 dark:border-gray-800">
              <SidebarContent>
                <div className="p-6">
                  <h1 className="text-primary flex items-center gap-2">
                    <BookOpen className="w-6 h-6" />
                    BiblioManager
                  </h1>
                </div>
                <SidebarGroup>
                  <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {menuItems.map((item) => (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton
                            onClick={() => {
                              setCurrentView(item.id);
                              localStorage.setItem(
                                STORAGE_KEY,
                                JSON.stringify({
                                  token: localStorage.getItem(STORAGE_KEY) ? JSON.parse(localStorage.getItem(STORAGE_KEY)!).token : 'session',
                                  user: currentUser,
                                  view: item.id,
                                })
                              );
                            }}
                            isActive={currentView === item.id}
                            tooltip={item.label}
                          >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
                <div className="mt-auto p-4">
                  <button
                    onClick={toggleDarkMode}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    <span>{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
                  </button>
                </div>
              </SidebarContent>
            </Sidebar>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <Topbar currentUser={currentUser} onLogout={handleLogout} />
              <main className="flex-1 overflow-y-auto">
                {renderView()}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </div>
      <Toaster />
    </div>
  );
}
