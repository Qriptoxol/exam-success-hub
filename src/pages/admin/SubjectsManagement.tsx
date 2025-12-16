import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Subject = Database['public']['Tables']['subjects']['Row'];
type ExamType = Database['public']['Enums']['exam_type'];

const SubjectsManagement = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    exam_type: 'ЕГЭ' as ExamType,
    price: 0,
    original_price: 0,
    icon: 'book',
    is_active: true,
    is_popular: false,
    demo_content: '',
    full_content: '',
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Ошибка загрузки предметов');
      return;
    }
    setSubjects(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      if (editingSubject) {
        const { error } = await supabase
          .from('subjects')
          .update(formData)
          .eq('id', editingSubject.id);
        if (error) throw error;
        toast.success('Предмет обновлён');
      } else {
        const { error } = await supabase
          .from('subjects')
          .insert(formData);
        if (error) throw error;
        toast.success('Предмет создан');
      }
      setDialogOpen(false);
      resetForm();
      fetchSubjects();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить предмет?')) return;
    
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) {
      toast.error('Ошибка удаления');
      return;
    }
    toast.success('Предмет удалён');
    fetchSubjects();
  };

  const openEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      title: subject.title,
      description: subject.description || '',
      exam_type: subject.exam_type,
      price: subject.price,
      original_price: subject.original_price || 0,
      icon: subject.icon,
      is_active: subject.is_active ?? true,
      is_popular: subject.is_popular ?? false,
      demo_content: subject.demo_content || '',
      full_content: subject.full_content || '',
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingSubject(null);
    setFormData({
      title: '',
      description: '',
      exam_type: 'ЕГЭ',
      price: 0,
      original_price: 0,
      icon: 'book',
      is_active: true,
      is_popular: false,
      demo_content: '',
      full_content: '',
    });
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-lg" />)}
    </div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Предметы ({subjects.length})</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Добавить</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSubject ? 'Редактировать' : 'Создать'} предмет</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Название</Label>
                  <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                </div>
                <div>
                  <Label>Тип экзамена</Label>
                  <Select value={formData.exam_type} onValueChange={(v: ExamType) => setFormData({ ...formData, exam_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ЕГЭ">ЕГЭ</SelectItem>
                      <SelectItem value="ОГЭ">ОГЭ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Описание</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Цена (⭐)</Label>
                  <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: +e.target.value })} />
                </div>
                <div>
                  <Label>Старая цена</Label>
                  <Input type="number" value={formData.original_price} onChange={(e) => setFormData({ ...formData, original_price: +e.target.value })} />
                </div>
                <div>
                  <Label>Иконка</Label>
                  <Input value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={formData.is_active} onCheckedChange={(v) => setFormData({ ...formData, is_active: v })} />
                  <Label>Активен</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.is_popular} onCheckedChange={(v) => setFormData({ ...formData, is_popular: v })} />
                  <Label>Популярный</Label>
                </div>
              </div>
              <div>
                <Label>Демо-контент</Label>
                <Textarea rows={3} value={formData.demo_content} onChange={(e) => setFormData({ ...formData, demo_content: e.target.value })} />
              </div>
              <div>
                <Label>Полный контент</Label>
                <Textarea rows={5} value={formData.full_content} onChange={(e) => setFormData({ ...formData, full_content: e.target.value })} />
              </div>
              <Button className="w-full" onClick={handleSave}>Сохранить</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {subjects.map((subject) => (
          <Card key={subject.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${subject.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                  📚
                </div>
                <div>
                  <p className="font-medium">{subject.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {subject.exam_type} • {subject.price} ⭐
                    {!subject.is_active && ' • Неактивен'}
                    {subject.is_popular && ' • Популярный'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => openEdit(subject)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleDelete(subject.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SubjectsManagement;
