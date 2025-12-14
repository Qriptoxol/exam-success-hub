import { ShoppingCart, Trash2, CreditCard, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { useCart, useRemoveFromCart, useCreateOrder } from "@/hooks/useData";
import { useTelegram } from "@/contexts/TelegramContext";

export const CartSection = () => {
  const { isAuthenticated } = useTelegram();
  const { data: cartItems, isLoading } = useCart();
  const removeFromCart = useRemoveFromCart();
  const createOrder = useCreateOrder();

  const totalPrice = cartItems?.reduce((sum, item) => {
    return sum + (item.subject?.price || 0);
  }, 0) || 0;

  const handleCheckout = () => {
    if (!cartItems?.length) return;
    const subjectIds = cartItems.map(item => item.subject_id);
    createOrder.mutate(subjectIds);
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 pb-24 animate-fade-in">
        <h2 className="text-2xl font-bold text-foreground mb-6">Корзина</h2>
        <div className="bg-card rounded-2xl p-8 shadow-md border border-border/50 text-center">
          <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Войдите в аккаунт</h3>
          <p className="text-muted-foreground mb-4">
            Чтобы добавлять товары в корзину, войдите через Telegram
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 pb-24 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cartItems?.length) {
    return (
      <div className="p-4 pb-24 animate-fade-in">
        <h2 className="text-2xl font-bold text-foreground mb-6">Корзина</h2>
        <div className="bg-card rounded-2xl p-8 shadow-md border border-border/50 text-center">
          <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Корзина пуста</h3>
          <p className="text-muted-foreground">
            Добавьте товары из каталога для оформления заказа
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 animate-fade-in">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        Корзина <span className="text-muted-foreground font-normal text-lg">({cartItems.length})</span>
      </h2>

      <div className="space-y-3 mb-6">
        {cartItems.map((item) => (
          <div
            key={item.id}
            className="bg-card rounded-xl p-4 shadow-sm border border-border/50 flex items-center gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-secondary text-muted-foreground">
                  {item.subject?.exam_type}
                </span>
              </div>
              <h3 className="font-semibold text-foreground truncate">{item.subject?.title}</h3>
              <p className="text-lg font-bold text-primary">{item.subject?.price} ₽</p>
            </div>
            <button
              onClick={() => removeFromCart.mutate(item.subject_id)}
              disabled={removeFromCart.isPending}
              className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <div className="bg-card rounded-2xl p-5 shadow-md border border-border/50 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-muted-foreground">Товаров:</span>
          <span className="font-medium text-foreground">{cartItems.length}</span>
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-muted-foreground">Скидка:</span>
          <span className="font-medium text-accent">
            -{cartItems.reduce((sum, item) => {
              const original = item.subject?.original_price || item.subject?.price || 0;
              const current = item.subject?.price || 0;
              return sum + (original - current);
            }, 0)} ₽
          </span>
        </div>
        <div className="border-t border-border/50 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-foreground">Итого:</span>
            <span className="text-2xl font-bold text-foreground">{totalPrice} ₽</span>
          </div>
        </div>
      </div>

      <Button
        variant="gradient"
        size="xl"
        className="w-full"
        onClick={handleCheckout}
        disabled={createOrder.isPending}
      >
        {createOrder.isPending ? (
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
        ) : (
          <CreditCard className="w-5 h-5 mr-2" />
        )}
        Оформить заказ
      </Button>
    </div>
  );
};
