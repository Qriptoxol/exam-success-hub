import { Calculator, BookText, Atom, Globe2, FlaskConical, History, Leaf, Code, LucideIcon, Heart } from "lucide-react";
import { Button } from "./ui/button";

const iconMap: Record<string, LucideIcon> = {
  calculator: Calculator,
  "book-text": BookText,
  atom: Atom,
  globe: Globe2,
  "flask-conical": FlaskConical,
  history: History,
  leaf: Leaf,
  code: Code,
  book: BookText,
};

interface SubjectCardProps {
  id: string;
  icon: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  popular?: boolean;
  examType: "ЕГЭ" | "ОГЭ";
  isFavorite?: boolean;
  onAddToCart?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
}

export const SubjectCard = ({
  id,
  icon,
  title,
  description,
  price,
  originalPrice,
  popular,
  examType,
  isFavorite,
  onAddToCart,
  onToggleFavorite,
}: SubjectCardProps) => {
  const Icon = iconMap[icon] || BookText;

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
            {onToggleFavorite && (
              <button
                onClick={() => onToggleFavorite(id)}
                className="ml-auto p-1 rounded-full hover:bg-secondary transition-colors"
              >
                <Heart
                  className={`w-4 h-4 transition-colors ${
                    isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
                  }`}
                />
              </button>
            )}
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
        <Button size="sm" variant="gradient" onClick={() => onAddToCart?.(id)}>
          В корзину
        </Button>
      </div>
    </div>
  );
};
