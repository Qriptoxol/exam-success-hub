import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

interface Profile {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
}

interface TelegramContextType {
  telegramUser: TelegramUser | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const TelegramContext = createContext<TelegramContextType>({
  telegramUser: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
});

export const useTelegram = () => useContext(TelegramContext);

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: TelegramUser;
          auth_date?: number;
          hash?: string;
          query_id?: string;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
          setText: (text: string) => void;
        };
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
        colorScheme: "light" | "dark";
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        enableClosingConfirmation: () => void;
        disableClosingConfirmation: () => void;
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
        openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
        openTelegramLink: (url: string) => void;
        openInvoice: (url: string, callback?: (status: string) => void) => void;
      };
    };
  }
}

export const TelegramProvider = ({ children }: { children: ReactNode }) => {
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initTelegram = async () => {
      try {
        const tg = window.Telegram?.WebApp;
        
        if (!tg) {
          console.log("Not running in Telegram WebApp");
          // For development, use mock data
          if (import.meta.env.DEV) {
            const mockUser: TelegramUser = {
              id: 123456789,
              first_name: "Test",
              last_name: "User",
              username: "testuser",
            };
            setTelegramUser(mockUser);
            
            // Create mock profile in dev mode
            const { data: existingProfile } = await supabase
              .from("profiles")
              .select("*")
              .eq("telegram_id", mockUser.id)
              .maybeSingle();
              
            if (existingProfile) {
              setProfile(existingProfile);
            } else {
              const { data: newProfile } = await supabase
                .from("profiles")
                .insert({
                  telegram_id: mockUser.id,
                  username: mockUser.username,
                  first_name: mockUser.first_name,
                  last_name: mockUser.last_name,
                })
                .select()
                .single();
              setProfile(newProfile);
            }
          }
          setIsLoading(false);
          return;
        }

        // Initialize Telegram WebApp
        tg.ready();
        tg.expand();

        const initData = tg.initData;
        const user = tg.initDataUnsafe.user;

        if (!initData || !user) {
          console.log("No Telegram user data available");
          setIsLoading(false);
          return;
        }

        setTelegramUser(user);

        // Authenticate with backend
        const { data, error: authError } = await supabase.functions.invoke("telegram-auth", {
          body: { initData },
        });

        if (authError) {
          console.error("Auth error:", authError);
          setError("Ошибка авторизации");
          setIsLoading(false);
          return;
        }

        if (data?.profile) {
          setProfile(data.profile);
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Error initializing Telegram:", err);
        setError("Ошибка инициализации");
        setIsLoading(false);
      }
    };

    initTelegram();
  }, []);

  return (
    <TelegramContext.Provider
      value={{
        telegramUser,
        profile,
        isLoading,
        isAuthenticated: !!profile,
        error,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
};
