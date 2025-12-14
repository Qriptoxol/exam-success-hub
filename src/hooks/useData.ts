import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTelegram } from "@/contexts/TelegramContext";
import {
  getSubjects,
  getCartItems,
  addToCart,
  removeFromCart,
  clearCart,
  getFavorites,
  toggleFavorite,
  getOrders,
  createOrder,
  getProfileStats,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function useSubjects(category?: string) {
  return useQuery({
    queryKey: ["subjects", category],
    queryFn: () => getSubjects(category),
  });
}

export function useCart() {
  const { profile } = useTelegram();
  
  return useQuery({
    queryKey: ["cart", profile?.id],
    queryFn: () => (profile ? getCartItems(profile.id) : []),
    enabled: !!profile,
  });
}

export function useAddToCart() {
  const { profile } = useTelegram();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (subjectId: string) => {
      if (!profile) throw new Error("Not authenticated");
      return addToCart(profile.id, subjectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({
        title: "Добавлено в корзину",
        description: "Товар добавлен в вашу корзину",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить в корзину",
        variant: "destructive",
      });
    },
  });
}

export function useRemoveFromCart() {
  const { profile } = useTelegram();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (subjectId: string) => {
      if (!profile) throw new Error("Not authenticated");
      return removeFromCart(profile.id, subjectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({
        title: "Удалено",
        description: "Товар удалён из корзины",
      });
    },
  });
}

export function useClearCart() {
  const { profile } = useTelegram();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!profile) throw new Error("Not authenticated");
      return clearCart(profile.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useFavorites() {
  const { profile } = useTelegram();

  return useQuery({
    queryKey: ["favorites", profile?.id],
    queryFn: () => (profile ? getFavorites(profile.id) : []),
    enabled: !!profile,
  });
}

export function useToggleFavorite() {
  const { profile } = useTelegram();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (subjectId: string) => {
      if (!profile) throw new Error("Not authenticated");
      return toggleFavorite(profile.id, subjectId);
    },
    onSuccess: (isFavorite) => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast({
        title: isFavorite ? "Добавлено в избранное" : "Удалено из избранного",
      });
    },
  });
}

export function useOrders() {
  const { profile } = useTelegram();

  return useQuery({
    queryKey: ["orders", profile?.id],
    queryFn: () => (profile ? getOrders(profile.id) : []),
    enabled: !!profile,
  });
}

export function useCreateOrder() {
  const { profile } = useTelegram();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (subjectIds: string[]) => {
      if (!profile) throw new Error("Not authenticated");
      return createOrder(profile.id, subjectIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({
        title: "Заказ создан",
        description: "Перейдите к оплате",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать заказ",
        variant: "destructive",
      });
    },
  });
}

export function useProfileStats() {
  const { profile } = useTelegram();

  return useQuery({
    queryKey: ["profileStats", profile?.id],
    queryFn: () => (profile ? getProfileStats(profile.id) : { totalSpent: 0, orderCount: 0 }),
    enabled: !!profile,
  });
}
