import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Tag, Copy } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type PromoCode = Database['public']['Tables']['promo_codes']['Row'];

const PromoManagement = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_percent: 10,
    max_uses: 100,
    is_active: true,
    expires_at: '',
  });

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Ошибка загрузки промокодов');
      return;
    }
    setPromoCodes(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      const payload = {
        code: formData.code.toUpperCase(),
        discount_percent: formData.discount_percent,
        max_uses: formData.max_uses || null,
        is_active: formData.is_active,
        expires_at: formData.expires_at || null,
      };

      if (editingPromo) {
        const { error } = await supabase
          .from('promo_codes')
          .update(payload)
          .eq('id', editingPromo.id);
        if (error) throw error;
        toast.success('Промокод обновлён');
      } else {
        const { error } = await supabase
          .from('promo_codes')
          .insert(payload);
        if (error) throw error;
        toast.success('Промокод создан');
      }
      setDialogOpen(false);
      resetForm();
      fetchPromoCodes();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить промокод?')) return;
    
    const { error } = await supabase.from('promo_codes').delete().eq('id', id);
    if (error) {
      toast.error('Ошибка удаления');
      return;
    }
    toast.success('Промокод удалён');
    fetchPromoCodes();
  };

  const openEdit = (promo: PromoCode) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      discount_percent: promo.discount_percent,
      max_uses: promo.max_uses || 0,
      is_active: promo.is_active,
      expires_at: promo.expires_at ? promo.expires_at.split('T')[0] : '',
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingPromo(null);
    setFormData({
      code: '',
      discount_percent: 10,
      max_uses: 100,
      is_active: true,
      expires_at: '',
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Код скопирован');
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-lg" />)}
    </div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Промокоды ({promoCodes.length})</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Создать</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPromo ? 'Редактировать' : 'Создать'} промокод</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Код</Label>
                <Input 
                  value={formData.code} 
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="DISCOUNT10"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Скидка (%)</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    max="100"
                    value={formData.discount_percent} 
                    onChange={(e) => setFormData({ ...formData, discount_percent: +e.target.value })} 
                  />
                </div>
                <div>
                  <Label>Макс. использований</Label>
                  <Input 
                    type="number"
                    value={formData.max_uses} 
                    onChange={(e) => setFormData({ ...formData, max_uses: +e.target.value })} 
                    placeholder="Без ограничений"
                  />
                </div>
              </div>
              <div>
                <Label>Действует до</Label>
                <Input 
                  type="date"
                  value={formData.expires_at} 
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })} 
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={formData.is_active} onCheckedChange={(v) => setFormData({ ...formData, is_active: v })} />
                <Label>Активен</Label>
              </div>
              <Button className="w-full" onClick={handleSave}>Сохранить</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {promoCodes.map((promo) => (
          <Card key={promo.id} className={!promo.is_active ? 'opacity-60' : ''}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Tag className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-bold">{promo.code}</p>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(promo.code)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    -{promo.discount_percent}% • 
                    Использовано: {promo.current_uses}{promo.max_uses ? `/${promo.max_uses}` : ''} • 
                    {promo.expires_at ? `До ${new Date(promo.expires_at).toLocaleDateString('ru-RU')}` : 'Бессрочный'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => openEdit(promo)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleDelete(promo.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {promoCodes.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Промокодов пока нет</p>
        )}
      </div>
    </div>
  );
};

export default PromoManagement;
