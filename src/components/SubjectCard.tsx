import { LucideIcon } from "lucide-react";
import { Button } from "./ui/button";

interface SubjectCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  popular?: boolean;
  examType: "ЕГЭ" | "ОГЭ";
}

export const SubjectCard = ({
  icon: Icon,
  title,
  description,
  price,
  originalPrice,
  popular,
  examType,
}: SubjectCardProps) => {
  return (
    <div className="group relative bg-card rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border/50 animate-fade-in">
      {popular && (
        <div className="absolute -top-2 -right-2 gradient-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full shadow-md">
          ХИТ
        </div>
      )}
      
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-md group-hover:shadow-glow transition-shadow duration-300">
          <Icon className="w-6 h-6 text-primary-foreground" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-secondary text-muted-foreground">
              {examType}
            </span>
          </div>
          <h3 className="font-bold text-foreground truncate">{title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-foreground">{price} ₽</span>
          {originalPrice && (
            <span className="text-sm text-muted-foreground line-through">{originalPrice} ₽</span>
          )}
        </div>
        <Button size="sm" variant="gradient">
          Купить
        </Button>
      </div>
    </div>
  );
};
