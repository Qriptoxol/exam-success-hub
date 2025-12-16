import { useEffect, useState } from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  BookOpen, 
  ShoppingCart, 
  Users, 
  Tag, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/admin');
      return;
    }

    const { data: roleData } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!roleData) {
      await supabase.auth.signOut();
      navigate('/admin');
      return;
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Обзор', path: '/admin/dashboard' },
    { icon: BookOpen, label: 'Предметы', path: '/admin/dashboard/subjects' },
    { icon: ShoppingCart, label: 'Заказы', path: '/admin/dashboard/orders' },
    { icon: Users, label: 'Пользователи', path: '/admin/dashboard/users' },
    { icon: Tag, label: 'Промокоды', path: '/admin/dashboard/promo' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 bg-card border-r transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"
      )}>
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <h1 className="font-bold text-lg">Админ-панель</h1>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                location.pathname === item.path 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Выйти
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn("flex-1 transition-all duration-300", sidebarOpen ? "lg:ml-64" : "")}>
        <header className="h-16 border-b bg-card flex items-center px-4 gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="w-5 h-5" />
          </Button>
          <h2 className="font-semibold">
            {navItems.find(i => i.path === location.pathname)?.label || 'Обзор'}
          </h2>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}
    </div>
  );
};

export default AdminDashboard;
