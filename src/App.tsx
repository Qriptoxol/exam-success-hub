import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TelegramProvider } from "@/contexts/TelegramContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Overview from "./pages/admin/Overview";
import SubjectsManagement from "./pages/admin/SubjectsManagement";
import OrdersManagement from "./pages/admin/OrdersManagement";
import UsersManagement from "./pages/admin/UsersManagement";
import PromoManagement from "./pages/admin/PromoManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TelegramProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />}>
              <Route index element={<Overview />} />
              <Route path="subjects" element={<SubjectsManagement />} />
              <Route path="orders" element={<OrdersManagement />} />
              <Route path="users" element={<UsersManagement />} />
              <Route path="promo" element={<PromoManagement />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </TelegramProvider>
  </QueryClientProvider>
);

export default App;
