import { User, ShoppingBag, Heart, Settings, ChevronRight, LogOut, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { useTelegram } from "@/contexts/TelegramContext";
import { useProfileStats, useOrders } from "@/hooks/useData";

export const ProfileSection = () => {
  const { profile, telegramUser, isAuthenticated } = useTelegram();
  const { data: stats, isLoading: statsLoading } = useProfileStats();
  const { data: orders } = useOrders();

  const displayName = profile?.first_name || telegramUser?.first_name || "Гость";
  const username = profile?.username || telegramUser?.username;

  return (
    <div className="p-4 pb-24 animate-fade-in">
      {/* Profile Header */}
      <div className="bg-card rounded-2xl p-5 shadow-md border border-border/50 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-lg overflow-hidden">
            {profile?.photo_url ? (
              <img src={profile.photo_url} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-primary-foreground" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
            {username ? (
              <p className="text-sm text-muted-foreground">@{username}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {isAuthenticated ? "Профиль подключён" : "Войдите для покупок"}
              </p>
            )}
          </div>
        </div>
        
        {!isAuthenticated && (
          <Button variant="gradient" className="w-full mt-4">
            Войти через Telegram
          </Button>
        )}
      </div>
      
      {/* Menu Items */}
      <div className="bg-card rounded-2xl shadow-md border border-border/50 overflow-hidden">
        <MenuItem 
          icon={ShoppingBag} 
          label="История покупок" 
          badge={orders?.length?.toString() || "0"} 
        />
        <MenuItem icon={Heart} label="Избранное" />
        <MenuItem icon={Settings} label="Настройки" isLast />
      </div>
      
      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-card rounded-xl p-4 text-center shadow-sm border border-border/50">
          {statsLoading ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
          ) : (
            <>
              <div className="text-2xl font-bold text-foreground">{stats?.orderCount || 0}</div>
              <div className="text-sm text-muted-foreground">Покупок</div>
            </>
          )}
        </div>
        <div className="bg-card rounded-xl p-4 text-center shadow-sm border border-border/50">
          {statsLoading ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
          ) : (
            <>
              <div className="text-2xl font-bold text-foreground">{stats?.totalSpent || 0} ₽</div>
              <div className="text-sm text-muted-foreground">Потрачено</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface MenuItemProps {
  icon: React.ElementType;
  label: string;
  badge?: string;
  isLast?: boolean;
}

const MenuItem = ({ icon: Icon, label, badge, isLast }: MenuItemProps) => (
  <button
    className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary/50 transition-colors ${
      !isLast ? "border-b border-border/50" : ""
    }`}
  >
    <Icon className="w-5 h-5 text-muted-foreground" />
    <span className="flex-1 text-left font-medium text-foreground">{label}</span>
    {badge && (
      <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
        {badge}
      </span>
    )}
    <ChevronRight className="w-5 h-5 text-muted-foreground" />
  </button>
);
