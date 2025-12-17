import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TelegramSuccessfulPayment {
  currency: string;
  total_amount: number;
  invoice_payload: string;
  telegram_payment_charge_id: string;
  provider_payment_charge_id: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
    successful_payment?: TelegramSuccessfulPayment;
  };
  pre_checkout_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
    };
    currency: string;
    total_amount: number;
    invoice_payload: string;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
    };
    message?: {
      chat: {
        id: number;
      };
    };
    data?: string;
  };
}

async function sendTelegramMessage(
  botToken: string, 
  chatId: number, 
  text: string, 
  replyMarkup?: any
) {
  const body: any = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  };
  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }
  
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return response.json();
}

async function answerCallbackQuery(botToken: string, queryId: string, text?: string) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: queryId,
      text,
    }),
  });
  return response.json();
}

async function answerPreCheckoutQuery(botToken: string, queryId: string, ok: boolean, errorMessage?: string) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pre_checkout_query_id: queryId,
      ok,
      error_message: errorMessage,
    }),
  });
  return response.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      console.error("TELEGRAM_BOT_TOKEN not configured");
      return new Response("OK", { status: 200 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const update: TelegramUpdate = await req.json();
    console.log("Received Telegram update:", JSON.stringify(update));

    // Handle /start command
    if (update.message?.text?.startsWith("/start")) {
      const chatId = update.message.chat.id;
      const firstName = update.message.from.first_name;
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: "📚 ЕГЭ", callback_data: "category_ЕГЭ" },
            { text: "📖 ОГЭ", callback_data: "category_ОГЭ" },
          ],
          [
            { text: "🛒 Мои заказы", callback_data: "my_orders" },
            { text: "🎁 Промокод", callback_data: "promo" },
          ],
          [
            { text: "🛍 Открыть магазин", web_app: { url: "https://ewmstejympjtlejzoowb.lovable.app" } },
          ],
        ],
      };
      
      await sendTelegramMessage(
        botToken,
        chatId,
        `👋 Привет, ${firstName}!\n\n` +
        `Добро пожаловать в <b>ExamShop</b> — магазин ответов на ЕГЭ и ОГЭ 2025!\n\n` +
        `📚 У нас вы найдёте:\n` +
        `• Математика (профиль и база)\n` +
        `• Русский язык\n` +
        `• Обществознание\n` +
        `• Физика, химия, история\n` +
        `• И другие предметы!\n\n` +
        `Выберите категорию или откройте магазин:`,
        keyboard
      );
    }

    // Handle /orders command
    if (update.message?.text?.startsWith("/orders")) {
      const chatId = update.message.chat.id;
      const telegramId = update.message.from.id;
      
      // Get profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("telegram_id", telegramId)
        .maybeSingle();

      if (!profile) {
        await sendTelegramMessage(botToken, chatId, "❌ Вы ещё не зарегистрированы. Откройте магазин через кнопку ниже.");
        return new Response("OK", { status: 200 });
      }

      const { data: orders } = await supabase
        .from("orders")
        .select("*, order_items(subject:subjects(title))")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!orders || orders.length === 0) {
        await sendTelegramMessage(botToken, chatId, "📭 У вас пока нет заказов.\n\nОткройте магазин, чтобы сделать первую покупку!");
        return new Response("OK", { status: 200 });
      }

      const statusEmoji: Record<string, string> = {
        pending: "⏳",
        paid: "✅",
        delivered: "📬",
        cancelled: "❌",
      };

      const statusText: Record<string, string> = {
        pending: "Ожидает оплаты",
        paid: "Оплачен",
        delivered: "Доставлен",
        cancelled: "Отменён",
      };

      let message = "📦 <b>Ваши заказы:</b>\n\n";
      for (const order of orders) {
        const items = (order as any).order_items?.map((item: any) => item.subject?.title).filter(Boolean).join(", ") || "—";
        const date = new Date(order.created_at).toLocaleDateString("ru-RU");
        message += `${statusEmoji[order.status]} <b>#${order.id.slice(0, 8)}</b>\n`;
        message += `📅 ${date} • ${order.total_amount} ⭐\n`;
        message += `📚 ${items}\n`;
        message += `Статус: ${statusText[order.status]}\n\n`;
      }

      await sendTelegramMessage(botToken, chatId, message);
    }

    // Handle /promo command
    if (update.message?.text?.startsWith("/promo")) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      const parts = text.split(" ");
      
      if (parts.length < 2) {
        await sendTelegramMessage(
          botToken, 
          chatId, 
          "🎁 <b>Промокоды</b>\n\n" +
          "Чтобы применить промокод, введите:\n" +
          "<code>/promo КОД</code>\n\n" +
          "Например: /promo DISCOUNT10"
        );
        return new Response("OK", { status: 200 });
      }

      const code = parts[1].toUpperCase();
      const { data: promo } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle();

      if (!promo) {
        await sendTelegramMessage(botToken, chatId, "❌ Промокод не найден или недействителен.");
        return new Response("OK", { status: 200 });
      }

      if (promo.max_uses && promo.current_uses >= promo.max_uses) {
        await sendTelegramMessage(botToken, chatId, "❌ Этот промокод уже использован максимальное количество раз.");
        return new Response("OK", { status: 200 });
      }

      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        await sendTelegramMessage(botToken, chatId, "❌ Срок действия промокода истёк.");
        return new Response("OK", { status: 200 });
      }

      await sendTelegramMessage(
        botToken, 
        chatId, 
        `✅ <b>Промокод найден!</b>\n\n` +
        `🎁 Код: <code>${promo.code}</code>\n` +
        `💰 Скидка: <b>${promo.discount_percent}%</b>\n\n` +
        `Используйте его при оформлении заказа в магазине.`
      );
    }

    // Handle callback queries (inline buttons)
    if (update.callback_query) {
      const query = update.callback_query;
      const chatId = query.message?.chat.id;
      const data = query.data;

      if (!chatId) {
        await answerCallbackQuery(botToken, query.id);
        return new Response("OK", { status: 200 });
      }

      // Category selection
      if (data?.startsWith("category_")) {
        const examType = data.replace("category_", "");
        
        const { data: subjects } = await supabase
          .from("subjects")
          .select("*")
          .eq("exam_type", examType)
          .eq("is_active", true)
          .limit(10);

        if (!subjects || subjects.length === 0) {
          await answerCallbackQuery(botToken, query.id, "Предметы не найдены");
          return new Response("OK", { status: 200 });
        }

        let message = `📚 <b>${examType} — Доступные предметы:</b>\n\n`;
        for (const subject of subjects) {
          const discount = subject.original_price ? Math.round((1 - subject.price / subject.original_price) * 100) : 0;
          message += `📖 <b>${subject.title}</b>\n`;
          message += `💰 ${subject.price} ⭐`;
          if (discount > 0) {
            message += ` <s>${subject.original_price} ⭐</s> (-${discount}%)`;
          }
          message += `\n\n`;
        }

        message += `\n🛍 Откройте магазин для покупки!`;

        const keyboard = {
          inline_keyboard: [
            [{ text: "🛍 Открыть магазин", web_app: { url: "https://ewmstejympjtlejzoowb.lovable.app" } }],
            [{ text: "⬅️ Назад", callback_data: "back_to_menu" }],
          ],
        };

        await sendTelegramMessage(botToken, chatId, message, keyboard);
        await answerCallbackQuery(botToken, query.id);
      }

      // My orders button
      if (data === "my_orders") {
        await answerCallbackQuery(botToken, query.id);
        // Trigger orders command logic
        const telegramId = query.from.id;
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("telegram_id", telegramId)
          .maybeSingle();

        if (!profile) {
          await sendTelegramMessage(botToken, chatId, "❌ Вы ещё не зарегистрированы. Откройте магазин через кнопку.");
          return new Response("OK", { status: 200 });
        }

        const { data: orders } = await supabase
          .from("orders")
          .select("*, order_items(subject:subjects(title))")
          .eq("profile_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (!orders || orders.length === 0) {
          await sendTelegramMessage(botToken, chatId, "📭 У вас пока нет заказов.");
          return new Response("OK", { status: 200 });
        }

        const statusEmoji: Record<string, string> = {
          pending: "⏳",
          paid: "✅",
          delivered: "📬",
          cancelled: "❌",
        };

        let message = "📦 <b>Ваши последние заказы:</b>\n\n";
        for (const order of orders) {
          const items = (order as any).order_items?.map((item: any) => item.subject?.title).filter(Boolean).join(", ") || "—";
          message += `${statusEmoji[order.status]} #${order.id.slice(0, 8)} • ${order.total_amount} ⭐\n`;
          message += `📚 ${items}\n\n`;
        }

        await sendTelegramMessage(botToken, chatId, message);
      }

      // Promo button
      if (data === "promo") {
        await answerCallbackQuery(botToken, query.id);
        await sendTelegramMessage(
          botToken,
          chatId,
          "🎁 <b>Промокоды</b>\n\n" +
          "Чтобы применить промокод, введите:\n" +
          "<code>/promo КОД</code>\n\n" +
          "Например: /promo DISCOUNT10"
        );
      }

      // Back to menu
      if (data === "back_to_menu") {
        const keyboard = {
          inline_keyboard: [
            [
              { text: "📚 ЕГЭ", callback_data: "category_ЕГЭ" },
              { text: "📖 ОГЭ", callback_data: "category_ОГЭ" },
            ],
            [
              { text: "🛒 Мои заказы", callback_data: "my_orders" },
              { text: "🎁 Промокод", callback_data: "promo" },
            ],
            [
              { text: "🛍 Открыть магазин", web_app: { url: "https://ewmstejympjtlejzoowb.lovable.app" } },
            ],
          ],
        };
        
        await sendTelegramMessage(
          botToken,
          chatId,
          "🏠 <b>Главное меню</b>\n\nВыберите действие:",
          keyboard
        );
        await answerCallbackQuery(botToken, query.id);
      }
    }

    // Handle pre-checkout query (Telegram Payments)
    if (update.pre_checkout_query) {
      const query = update.pre_checkout_query;
      console.log("Pre-checkout query received:", query.id);
      
      const payload = JSON.parse(query.invoice_payload);
      const { data: order } = await supabase
        .from("orders")
        .select("*")
        .eq("id", payload.orderId)
        .single();

      if (order && order.status === "pending") {
        await answerPreCheckoutQuery(botToken, query.id, true);
      } else {
        await answerPreCheckoutQuery(botToken, query.id, false, "Заказ не найден или уже оплачен");
      }
    }

    // Handle successful payment
    if (update.message?.successful_payment) {
      const payment = update.message.successful_payment;
      const chatId = update.message.chat.id;
      console.log("Successful payment received:", payment);

      try {
        const payload = JSON.parse(payment.invoice_payload);
        
        await supabase
          .from("orders")
          .update({
            status: "paid",
            telegram_payment_charge_id: payment.telegram_payment_charge_id,
          })
          .eq("id", payload.orderId);

        const { data: orderItems } = await supabase
          .from("order_items")
          .select("subject:subjects(title, full_content)")
          .eq("order_id", payload.orderId);

        await sendTelegramMessage(
          botToken,
          chatId,
          `✅ <b>Оплата получена!</b>\n\n` +
          `Спасибо за покупку! Ваши материалы:\n\n` +
          (orderItems?.map((item: any) => 
            `📖 <b>${item.subject?.title}</b>`
          ).join("\n") || "Материалы будут отправлены отдельным сообщением.")
        );

        // Send full content for each subject
        if (orderItems) {
          for (const item of orderItems) {
            const subject = (item as any).subject;
            if (subject?.full_content) {
              await sendTelegramMessage(
                botToken,
                chatId,
                `📖 <b>${subject.title}</b>\n\n${subject.full_content}`
              );
            }
          }
        }

        await supabase
          .from("orders")
          .update({ status: "delivered" })
          .eq("id", payload.orderId);

      } catch (e) {
        console.error("Error processing payment:", e);
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error in telegram-webhook:", error);
    return new Response("OK", { status: 200 });
  }
});
