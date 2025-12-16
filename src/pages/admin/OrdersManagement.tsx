import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderStatus = Database['public']['Enums']['order_status'];

interface OrderWithProfile extends Order {
  profiles: { telegram_id: number; username: string | null; first_name: string | null } | null;
}

const OrdersManagement = () => {
  const [orders, setOrders] = useState<OrderWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, profiles(telegram_id, username, first_name)')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Ошибка загрузки заказов');
      return;
    }
    setOrders(data || []);
    setLoading(false);
  };

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      toast.error('Ошибка обновления статуса');
      return;
    }
    toast.success('Статус обновлён');
    fetchOrders();
  };

  const filteredOrders = orders.filter(order => {
    if (filter !== 'all' && order.status !== filter) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return order.id.toLowerCase().includes(searchLower) ||
        order.profiles?.username?.toLowerCase().includes(searchLower) ||
        order.profiles?.first_name?.toLowerCase().includes(searchLower);
    }
    return true;
  });

  const statusColors: Record<OrderStatus, string> = {
    pending: 'bg-yellow-500/20 text-yellow-500',
    paid: 'bg-green-500/20 text-green-500',
    delivered: 'bg-blue-500/20 text-blue-500',
    cancelled: 'bg-red-500/20 text-red-500',
  };

  const statusLabels: Record<OrderStatus, string> = {
    pending: 'Ожидает',
    paid: 'Оплачен',
    delivered: 'Доставлен',
    cancelled: 'Отменён',
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-lg" />)}
    </div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Поиск по ID или имени..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={filter} onValueChange={(v) => setFilter(v as OrderStatus | 'all')}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Фильтр по статусу" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="pending">Ожидает</SelectItem>
            <SelectItem value="paid">Оплачен</SelectItem>
            <SelectItem value="delivered">Доставлен</SelectItem>
            <SelectItem value="cancelled">Отменён</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-muted-foreground">Найдено: {filteredOrders.length}</p>

      <div className="space-y-3">
        {filteredOrders.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-sm text-muted-foreground">#{order.id.slice(0, 8)}</p>
                  <p className="font-medium">
                    {order.profiles?.first_name || order.profiles?.username || `ID: ${order.profiles?.telegram_id}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleString('ru-RU')}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-bold text-lg">{order.total_amount} ⭐</p>
                  <Select value={order.status} onValueChange={(v) => updateStatus(order.id, v as OrderStatus)}>
                    <SelectTrigger className={`w-36 ${statusColors[order.status]}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Ожидает</SelectItem>
                      <SelectItem value="paid">Оплачен</SelectItem>
                      <SelectItem value="delivered">Доставлен</SelectItem>
                      <SelectItem value="cancelled">Отменён</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredOrders.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Заказов не найдено</p>
        )}
      </div>
    </div>
  );
};

export default OrdersManagement;
