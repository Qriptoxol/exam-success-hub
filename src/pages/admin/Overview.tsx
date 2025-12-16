import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingCart, BookOpen, TrendingUp } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalOrders: number;
  totalSubjects: number;
  totalRevenue: number;
  recentOrders: any[];
}

const Overview = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalOrders: 0,
    totalSubjects: 0,
    totalRevenue: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersRes, ordersRes, subjectsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('*'),
        supabase.from('subjects').select('id', { count: 'exact', head: true }),
      ]);

      const paidOrders = ordersRes.data?.filter(o => o.status === 'paid') || [];
      const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

      setStats({
        totalUsers: usersRes.count || 0,
        totalOrders: ordersRes.data?.length || 0,
        totalSubjects: subjectsRes.count || 0,
        totalRevenue,
        recentOrders: ordersRes.data?.slice(0, 5) || [],
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Пользователи', value: stats.totalUsers, icon: Users, color: 'text-blue-500' },
    { label: 'Заказы', value: stats.totalOrders, icon: ShoppingCart, color: 'text-green-500' },
    { label: 'Предметы', value: stats.totalSubjects, icon: BookOpen, color: 'text-purple-500' },
    { label: 'Доход', value: `${stats.totalRevenue} ⭐`, icon: TrendingUp, color: 'text-yellow-500' },
  ];

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-muted rounded-lg" />
        ))}
      </div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Последние заказы</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Заказов пока нет</p>
          ) : (
            <div className="space-y-3">
              {stats.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">#{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{order.total_amount} ⭐</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'paid' ? 'bg-green-500/20 text-green-500' :
                      order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {order.status === 'paid' ? 'Оплачен' : 
                       order.status === 'pending' ? 'Ожидает' : order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Overview;
