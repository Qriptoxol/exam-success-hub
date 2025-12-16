import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Ban, CheckCircle, User } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'] & { is_blocked: boolean };

const UsersManagement = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Ошибка загрузки пользователей');
      return;
    }
    setUsers(data || []);
    setLoading(false);
  };

  const toggleBlock = async (userId: string, currentlyBlocked: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_blocked: !currentlyBlocked })
      .eq('id', userId);

    if (error) {
      toast.error('Ошибка обновления');
      return;
    }
    toast.success(currentlyBlocked ? 'Пользователь разблокирован' : 'Пользователь заблокирован');
    fetchUsers();
  };

  const filteredUsers = users.filter(user => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return user.username?.toLowerCase().includes(searchLower) ||
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower) ||
      user.telegram_id.toString().includes(searchLower);
  });

  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-lg" />)}
    </div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          placeholder="Поиск по имени или ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <p className="text-muted-foreground">Всего пользователей: {filteredUsers.length}</p>

      <div className="space-y-3">
        {filteredUsers.map((user) => (
          <Card key={user.id} className={user.is_blocked ? 'border-destructive/50' : ''}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={user.photo_url || ''} />
                  <AvatarFallback>
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {user.first_name || ''} {user.last_name || ''}
                    {user.username && <span className="text-muted-foreground ml-2">@{user.username}</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    TG ID: {user.telegram_id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Регистрация: {new Date(user.created_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
              <Button
                variant={user.is_blocked ? 'default' : 'destructive'}
                size="sm"
                onClick={() => toggleBlock(user.id, user.is_blocked)}
              >
                {user.is_blocked ? (
                  <><CheckCircle className="w-4 h-4 mr-2" />Разблокировать</>
                ) : (
                  <><Ban className="w-4 h-4 mr-2" />Заблокировать</>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
        {filteredUsers.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Пользователей не найдено</p>
        )}
      </div>
    </div>
  );
};

export default UsersManagement;
