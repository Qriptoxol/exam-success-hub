import { Home, BookOpen, ShoppingCart, User, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  cartCount?: number;
}

const navItems = [
  { id: "home", icon: Home, label: "Главная" },
  { id: "catalog", icon: BookOpen, label: "Каталог" },
  { id: "cart", icon: ShoppingCart, label: "Корзина" },
  { id: "profile", icon: User, label: "Профиль" },
  { id: "support", icon: MessageCircle, label: "Помощь" },
];

export const BottomNav = ({ activeTab, onTabChange, cartCount = 0 }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border/50 z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const showBadge = item.id === "cart" && cartCount > 0;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 w-16 py-2 transition-all duration-200",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "relative p-1.5 rounded-xl transition-all duration-200",
                  isActive && "gradient-primary shadow-md"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-primary-foreground" : "text-current"
                  )}
                />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
