import { Button } from "./ui/button";
import { Sparkles, Shield, Zap } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden py-8 px-4">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 gradient-primary opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-48 h-48 gradient-accent opacity-10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
      
      <div className="relative z-10">
        <div className="text-center mb-6 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Сезон 2025</span>
          </div>
          
          <h1 className="text-3xl font-extrabold text-foreground leading-tight mb-3">
            Ответы на{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
              ЕГЭ и ОГЭ
            </span>
          </h1>
          
          <p className="text-muted-foreground text-base max-w-sm mx-auto">
            Получи проверенные материалы для подготовки и сдай экзамены на отлично
          </p>
        </div>
        
        <div className="flex justify-center gap-3 mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <Button variant="gradient" size="lg">
            Каталог
          </Button>
          <Button variant="outline" size="lg">
            Демо
          </Button>
        </div>
        
        {/* Features */}
        <div className="grid grid-cols-3 gap-3 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="bg-card rounded-xl p-3 text-center shadow-sm border border-border/50">
            <div className="w-10 h-10 mx-auto rounded-lg gradient-primary flex items-center justify-center mb-2">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xs font-medium text-foreground">Безопасно</span>
          </div>
          
          <div className="bg-card rounded-xl p-3 text-center shadow-sm border border-border/50">
            <div className="w-10 h-10 mx-auto rounded-lg gradient-accent flex items-center justify-center mb-2">
              <Zap className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="text-xs font-medium text-foreground">Мгновенно</span>
          </div>
          
          <div className="bg-card rounded-xl p-3 text-center shadow-sm border border-border/50">
            <div className="w-10 h-10 mx-auto rounded-lg bg-gradient-to-r from-orange-400 to-pink-500 flex items-center justify-center mb-2">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xs font-medium text-foreground">Проверено</span>
          </div>
        </div>
      </div>
    </section>
  );
};
