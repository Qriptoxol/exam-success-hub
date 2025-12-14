import { MessageCircle, Send, HelpCircle, FileText, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

export const SupportSection = () => {
  return (
    <div className="p-4 pb-24 animate-fade-in">
      <h2 className="text-2xl font-bold text-foreground mb-6">Поддержка</h2>
      
      {/* Quick Actions */}
      <div className="bg-card rounded-2xl p-5 shadow-md border border-border/50 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Чат с оператором</h3>
            <p className="text-sm text-muted-foreground">Ответим в течение 5 минут</p>
          </div>
        </div>
        <Button variant="gradient" className="w-full">
          <Send className="w-4 h-4 mr-2" />
          Написать
        </Button>
      </div>
      
      {/* FAQ */}
      <h3 className="font-bold text-foreground mb-3">Частые вопросы</h3>
      <div className="bg-card rounded-2xl shadow-md border border-border/50 overflow-hidden mb-6">
        <FaqItem question="Как происходит оплата?" />
        <FaqItem question="Когда придут ответы?" />
        <FaqItem question="Какие гарантии?" />
        <FaqItem question="Можно ли вернуть деньги?" isLast />
      </div>
      
      {/* Documents */}
      <h3 className="font-bold text-foreground mb-3">Документы</h3>
      <div className="bg-card rounded-2xl shadow-md border border-border/50 overflow-hidden">
        <DocItem label="Пользовательское соглашение" />
        <DocItem label="Политика конфиденциальности" isLast />
      </div>
    </div>
  );
};

interface FaqItemProps {
  question: string;
  isLast?: boolean;
}

const FaqItem = ({ question, isLast }: FaqItemProps) => (
  <button
    className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary/50 transition-colors text-left ${
      !isLast ? "border-b border-border/50" : ""
    }`}
  >
    <HelpCircle className="w-5 h-5 text-primary shrink-0" />
    <span className="flex-1 font-medium text-foreground">{question}</span>
    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
  </button>
);

interface DocItemProps {
  label: string;
  isLast?: boolean;
}

const DocItem = ({ label, isLast }: DocItemProps) => (
  <button
    className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary/50 transition-colors text-left ${
      !isLast ? "border-b border-border/50" : ""
    }`}
  >
    <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
    <span className="flex-1 font-medium text-foreground">{label}</span>
    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
  </button>
);
