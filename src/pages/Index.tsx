import { useState } from "react";
import { useTelegram } from "@/contexts/TelegramContext";
import { useSubjects, useCart, useAddToCart, useFavorites, useToggleFavorite } from "@/hooks/useData";
import { HeroSection } from "@/components/HeroSection";
import { CategoryTabs } from "@/components/CategoryTabs";
import { SubjectCard } from "@/components/SubjectCard";
import { BottomNav } from "@/components/BottomNav";
import { ProfileSection } from "@/components/ProfileSection";
import { SupportSection } from "@/components/SupportSection";
import { CartSection } from "@/components/CartSection";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [activeCategory, setActiveCategory] = useState("all");
  
  const { isLoading: authLoading } = useTelegram();
  const { data: subjects, isLoading: subjectsLoading } = useSubjects(activeCategory === "all" ? undefined : activeCategory);
  const { data: cart } = useCart();
  const { data: favorites } = useFavorites();
  const addToCart = useAddToCart();
  const toggleFavorite = useToggleFavorite();

  const cartCount = cart?.length || 0;
  const favoriteIds = new Set(favorites?.map(f => f.subject_id) || []);

  const handleAddToCart = (subjectId: string) => {
    addToCart.mutate(subjectId);
  };

  const handleToggleFavorite = (subjectId: string) => {
    toggleFavorite.mutate(subjectId);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <>
            <HeroSection />
            <div className="px-4 pb-24">
              <div className="mb-4">
                <CategoryTabs activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
              </div>
              {subjectsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {subjects?.map((subject) => (
                    <SubjectCard
                      key={subject.id}
                      id={subject.id}
                      icon={subject.icon}
                      title={subject.title}
                      description={subject.description || ""}
                      price={subject.price}
                      originalPrice={subject.original_price || undefined}
                      examType={subject.exam_type as "ЕГЭ" | "ОГЭ"}
                      popular={subject.is_popular || false}
                      isFavorite={favoriteIds.has(subject.id)}
                      onAddToCart={handleAddToCart}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        );
      case "catalog":
        return (
          <div className="p-4 pb-24">
            <h2 className="text-2xl font-bold text-foreground mb-4">Каталог</h2>
            <CategoryTabs activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
            {subjectsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {subjects?.map((subject) => (
                  <SubjectCard
                    key={subject.id}
                    id={subject.id}
                    icon={subject.icon}
                    title={subject.title}
                    description={subject.description || ""}
                    price={subject.price}
                    originalPrice={subject.original_price || undefined}
                    examType={subject.exam_type as "ЕГЭ" | "ОГЭ"}
                    popular={subject.is_popular || false}
                    isFavorite={favoriteIds.has(subject.id)}
                    onAddToCart={handleAddToCart}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            )}
          </div>
        );
      case "cart":
        return <CartSection />;
      case "profile":
        return <ProfileSection />;
      case "support":
        return <SupportSection />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="h-safe-top bg-background" />
      
      <main className="max-w-lg mx-auto">
        {renderContent()}
      </main>
      
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} cartCount={cartCount} />
    </div>
  );
};

export default Index;
