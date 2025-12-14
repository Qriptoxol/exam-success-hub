import { useState } from "react";
import { Calculator, BookText, Atom, Globe2, FlaskConical, History, Palette, Music } from "lucide-react";
import { HeroSection } from "@/components/HeroSection";
import { CategoryTabs } from "@/components/CategoryTabs";
import { SubjectCard } from "@/components/SubjectCard";
import { BottomNav } from "@/components/BottomNav";
import { ProfileSection } from "@/components/ProfileSection";
import { SupportSection } from "@/components/SupportSection";

const subjects = [
  {
    id: 1,
    icon: Calculator,
    title: "Математика (профиль)",
    description: "Полный комплект с решениями",
    price: 990,
    originalPrice: 1490,
    examType: "ЕГЭ" as const,
    popular: true,
    category: "ege",
  },
  {
    id: 2,
    icon: BookText,
    title: "Русский язык",
    description: "Все типы заданий + сочинения",
    price: 890,
    originalPrice: 1290,
    examType: "ЕГЭ" as const,
    popular: true,
    category: "ege",
  },
  {
    id: 3,
    icon: Globe2,
    title: "Обществознание",
    description: "Теория и практика",
    price: 790,
    examType: "ЕГЭ" as const,
    category: "ege",
  },
  {
    id: 4,
    icon: Atom,
    title: "Физика",
    description: "Формулы и задачи",
    price: 890,
    examType: "ЕГЭ" as const,
    category: "ege",
  },
  {
    id: 5,
    icon: Calculator,
    title: "Математика",
    description: "Алгебра и геометрия",
    price: 590,
    originalPrice: 890,
    examType: "ОГЭ" as const,
    popular: true,
    category: "oge",
  },
  {
    id: 6,
    icon: BookText,
    title: "Русский язык",
    description: "Изложение и сочинение",
    price: 490,
    examType: "ОГЭ" as const,
    category: "oge",
  },
  {
    id: 7,
    icon: FlaskConical,
    title: "Химия",
    description: "Реакции и расчёты",
    price: 690,
    examType: "ЕГЭ" as const,
    category: "ege",
  },
  {
    id: 8,
    icon: History,
    title: "История",
    description: "Даты и события",
    price: 790,
    examType: "ЕГЭ" as const,
    category: "ege",
  },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredSubjects = subjects.filter((subject) => {
    if (activeCategory === "all") return true;
    if (activeCategory === "popular") return subject.popular;
    return subject.category === activeCategory;
  });

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
              <div className="space-y-4">
                {filteredSubjects.map((subject) => (
                  <SubjectCard key={subject.id} {...subject} />
                ))}
              </div>
            </div>
          </>
        );
      case "catalog":
        return (
          <div className="p-4 pb-24">
            <h2 className="text-2xl font-bold text-foreground mb-4">Каталог</h2>
            <CategoryTabs activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
            <div className="mt-4 space-y-4">
              {filteredSubjects.map((subject) => (
                <SubjectCard key={subject.id} {...subject} />
              ))}
            </div>
          </div>
        );
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
      {/* Status bar area */}
      <div className="h-safe-top bg-background" />
      
      {/* Main content */}
      <main className="max-w-lg mx-auto">
        {renderContent()}
      </main>
      
      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
