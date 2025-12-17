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
      message_id: number;
      chat: {
        id: number;
      };
    };
    data?: string;
  };
}

// Reply keyboard that stays at the bottom
const replyKeyboard = {
  keyboard: [
    [{ text: "📚 ЕГЭ" }, { text: "📖 ОГЭ" }],
    [{ text: "🛒 Мои заказы" }, { text: "🎁 Промокод" }],
    [{ text: "🏠 Главное меню" }],
  ],
  resize_keyboard: true,
  persistent: true,
};

// Inline keyboard for menu
const menuInlineKeyboard = {
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
      { text: "🛍 Открыть магазин", web_app: { url: "https://exam-succes-hub.vercel.app/" } },
    ],
  ],
};

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

async function editMessageText(
  botToken: string,
  chatId: number,
  messageId: number,
  text: string,
  replyMarkup?: any
) {
  const body: any = {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
  };
  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }
  
  const response = await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return response.json();
}

async function deleteMessage(botToken: string, chatId: number, messageId: number) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/deleteMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
    }),
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

  if (req.method === "GET") {
    return new Response("Telegram webhook is active", { status: 200, headers: corsHeaders });
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

    const body = await req.text();
    if (!body || body.trim() === "") {
      console.log("Empty request body received");
      return new Response("OK", { status: 200 });
    }

    let update: TelegramUpdate;
    try {
      update = JSON.parse(body);
    } catch (parseError) {
      console.error("Failed to parse JSON:", parseError);
      return new Response("OK", { status: 200 });
    }
    
    console.log("Received Telegram update:", JSON.stringify(update));

    // Handle text messages (commands and reply keyboard)
    if (update.message?.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      const firstName = update.message.from.first_name;
      const telegramId = update.message.from.id;
      const userMessageId = update.message.message_id;

      // Delete user's message to keep chat clean (except for promo codes)
      if (!text.startsWith("/promo ") && !text.match(/^[A-ZА-Я0-9]+$/i)) {
        try {
          await deleteMessage(botToken, chatId, userMessageId);
        } catch (e) {
          console.log("Could not delete user message");
        }
      }

      // /start or 🏠 Главное меню
      if (text === "/start" || text === "🏠 Главное меню") {
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
          `Выберите категорию:`,
          { ...menuInlineKeyboard, ...replyKeyboard }
        );
        return new Response("OK", { status: 200 });
      }

      // 📚 ЕГЭ button
      if (text === "📚 ЕГЭ") {
        const { data: subjects } = await supabase
          .from("subjects")
          .select("*")
          .eq("exam_type", "ЕГЭ")
          .eq("is_active", true)
          .limit(10);

        let message = `📚 <b>ЕГЭ — Доступные предметы:</b>\n\n`;
        if (subjects && subjects.length > 0) {
          for (const subject of subjects) {
            const discount = subject.original_price ? Math.round((1 - subject.price / subject.original_price) * 100) : 0;
            message += `📖 <b>${subject.title}</b>\n`;
            message += `💰 ${subject.price} ⭐`;
            if (discount > 0) {
              message += ` <s>${subject.original_price} ⭐</s> (-${discount}%)`;
            }
            message += `\n\n`;
          }
        } else {
          message += "Предметы не найдены.";
        }

        const keyboard = {
          inline_keyboard: [
            [{ text: "🛍 Открыть магазин", web_app: { url: "https://ewmstejympjtlejzoowb.lovable.app" } }],
          ],
        };

        await sendTelegramMessage(botToken, chatId, message, keyboard);
        return new Response("OK", { status: 200 });
      }

      // 📖 ОГЭ button
      if (text === "📖 ОГЭ") {
        const { data: subjects } = await supabase
          .from("subjects")
          .select("*")
          .eq("exam_type", "ОГЭ")
          .eq("is_active", true)
          .limit(10);

        let message = `📖 <b>ОГЭ — Доступные предметы:</b>\n\n`;
        if (subjects && subjects.length > 0) {
          for (const subject of subjects) {
            const discount = subject.original_price ? Math.round((1 - subject.price / subject.original_price) * 100) : 0;
            message += `📖 <b>${subject.title}</b>\n`;
            message += `💰 ${subject.price} ⭐`;
            if (discount > 0) {
              message += ` <s>${subject.original_price} ⭐</s> (-${discount}%)`;
            }
            message += `\n\n`;
          }
        } else {
          message += "Предметы не найдены.";
        }

        const keyboard = {
          inline_keyboard: [
            [{ text: "🛍 Открыть магазин", web_app: { url: "https://exam-succes-hub.vercel.app/" } }],
          ],
        };

        await sendTelegramMessage(botToken, chatId, message, keyboard);
        return new Response("OK", { status: 200 });
      }

      // 🛒 Мои заказы button or /orders
      if (text === "🛒 Мои заказы" || text === "/orders") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("telegram_id", telegramId)
          .maybeSingle();

        if (!profile) {
          const keyboard = {
            inline_keyboard: [
              [{ text: "🛍 Открыть магазин", web_app: { url: "https://exam-succes-hub.vercel.app/" } }],
            ],
          };
          await sendTelegramMessage(botToken, chatId, "❌ Вы ещё не зарегистрированы.\n\nОткройте магазин, чтобы начать!", keyboard);
          return new Response("OK", { status: 200 });
        }

        const { data: orders } = await supabase
          .from("orders")
          .select("*, order_items(subject:subjects(title))")
          .eq("profile_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (!orders || orders.length === 0) {
          const keyboard = {
            inline_keyboard: [
              [{ text: "🛍 Открыть магазин", web_app: { url: "https://exam-succes-hub.vercel.app/" } }],
            ],
          };
          await sendTelegramMessage(botToken, chatId, "📭 У вас пока нет заказов.\n\nОткройте магазин, чтобы сделать первую покупку!", keyboard);
          return new Response("OK", { status: 200 });
        }

        const statusEmoji: Record<string, string> = { pending: "⏳", paid: "✅", delivered: "📬", cancelled: "❌" };
        const statusText: Record<string, string> = { pending: "Ожидает оплаты", paid: "Оплачен", delivered: "Доставлен", cancelled: "Отменён" };

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
        return new Response("OK", { status: 200 });
      }

      // 🎁 Промокод button
      if (text === "🎁 Промокод") {
        await sendTelegramMessage(
          botToken,
          chatId,
          "🎁 <b>Промокоды</b>\n\n" +
          "Введите промокод в чат:\n\n" +
          "Например: <code>DISCOUNT10</code>"
        );
        return new Response("OK", { status: 200 });
      }

      // /promo command
      if (text.startsWith("/promo ")) {
        const code = text.replace("/promo ", "").toUpperCase().trim();
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
        return new Response("OK", { status: 200 });
      }

      // Check if text is a promo code (all caps/numbers)
      if (text.match(/^[A-ZА-ЯЁ0-9]{3,20}$/i)) {
        const code = text.toUpperCase();
        const { data: promo } = await supabase
          .from("promo_codes")
          .select("*")
          .eq("code", code)
          .eq("is_active", true)
          .maybeSingle();

        if (promo) {
          if (promo.max_uses && promo.current_uses >= promo.max_uses) {
            await sendTelegramMessage(botToken, chatId, "❌ Этот промокод уже использован максимальное количество раз.");
          } else if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
            await sendTelegramMessage(botToken, chatId, "❌ Срок действия промокода истёк.");
          } else {
            await sendTelegramMessage(
              botToken,
              chatId,
              `✅ <b>Промокод найден!</b>\n\n` +
              `🎁 Код: <code>${promo.code}</code>\n` +
              `💰 Скидка: <b>${promo.discount_percent}%</b>\n\n` +
              `Используйте его при оформлении заказа в магазине.`
            );
          }
          return new Response("OK", { status: 200 });
        }
      }
    }

    // Handle callback queries (inline buttons) - edit message instead of sending new
    if (update.callback_query) {
      const query = update.callback_query;
      const chatId = query.message?.chat.id;
      const messageId = query.message?.message_id;
      const data = query.data;
      const telegramId = query.from.id;

      if (!chatId || !messageId) {
        await answerCallbackQuery(botToken, query.id);
        return new Response("OK", { status: 200 });
      }

      // Category selection - edit message
      if (data?.startsWith("category_")) {
        const examType = data.replace("category_", "");
        
        const { data: subjects } = await supabase
          .from("subjects")
          .select("*")
          .eq("exam_type", examType)
          .eq("is_active", true)
          .limit(10);

        let message = `📚 <b>${examType} — Доступные предметы:</b>\n\n`;
        if (subjects && subjects.length > 0) {
          for (const subject of subjects) {
            const discount = subject.original_price ? Math.round((1 - subject.price / subject.original_price) * 100) : 0;
            message += `📖 <b>${subject.title}</b>\n`;
            message += `💰 ${subject.price} ⭐`;
            if (discount > 0) {
              message += ` <s>${subject.original_price} ⭐</s> (-${discount}%)`;
            }
            message += `\n\n`;
          }
        } else {
          message += "Предметы не найдены.";
        }

        const keyboard = {
          inline_keyboard: [
            [{ text: "🛍 Открыть магазин", web_app: { url: "https://exam-succes-hub.vercel.app/" } }],
            [{ text: "⬅️ Назад", callback_data: "back_to_menu" }],
          ],
        };

        await editMessageText(botToken, chatId, messageId, message, keyboard);
        await answerCallbackQuery(botToken, query.id);
        return new Response("OK", { status: 200 });
      }

      // My orders - edit message
      if (data === "my_orders") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("telegram_id", telegramId)
          .maybeSingle();

        if (!profile) {
          await editMessageText(
            botToken, chatId, messageId,
            "❌ Вы ещё не зарегистрированы.\n\nОткройте магазин, чтобы начать!",
            { inline_keyboard: [
              [{ text: "🛍 Открыть магазин", web_app: { url: "https://exam-succes-hub.vercel.app/" } }],
              [{ text: "⬅️ Назад", callback_data: "back_to_menu" }],
            ]}
          );
          await answerCallbackQuery(botToken, query.id);
          return new Response("OK", { status: 200 });
        }

        const { data: orders } = await supabase
          .from("orders")
          .select("*, order_items(subject:subjects(title))")
          .eq("profile_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(5);

        let message: string;
        if (!orders || orders.length === 0) {
          message = "📭 У вас пока нет заказов.\n\nОткройте магазин, чтобы сделать первую покупку!";
        } else {
          const statusEmoji: Record<string, string> = { pending: "⏳", paid: "✅", delivered: "📬", cancelled: "❌" };
          message = "📦 <b>Ваши последние заказы:</b>\n\n";
          for (const order of orders) {
            const items = (order as any).order_items?.map((item: any) => item.subject?.title).filter(Boolean).join(", ") || "—";
            message += `${statusEmoji[order.status]} #${order.id.slice(0, 8)} • ${order.total_amount} ⭐\n`;
            message += `📚 ${items}\n\n`;
          }
        }

        await editMessageText(botToken, chatId, messageId, message, {
          inline_keyboard: [
            [{ text: "🛍 Открыть магазин", web_app: { url: "https://exam-succes-hub.vercel.app/" } }],
            [{ text: "⬅️ Назад", callback_data: "back_to_menu" }],
          ],
        });
        await answerCallbackQuery(botToken, query.id);
        return new Response("OK", { status: 200 });
      }

      // Promo - edit message
      if (data === "promo") {
        await editMessageText(
          botToken, chatId, messageId,
          "🎁 <b>Промокоды</b>\n\n" +
          "Введите промокод в чат:\n\n" +
          "Например: <code>DISCOUNT10</code>",
          { inline_keyboard: [[{ text: "⬅️ Назад", callback_data: "back_to_menu" }]] }
        );
        await answerCallbackQuery(botToken, query.id);
        return new Response("OK", { status: 200 });
      }

      // Back to menu - edit message
      if (data === "back_to_menu") {
        await editMessageText(
          botToken, chatId, messageId,
          "🏠 <b>Главное меню</b>\n\nВыберите категорию:",
          menuInlineKeyboard
        );
        await answerCallbackQuery(botToken, query.id);
        return new Response("OK", { status: 200 });
      }

      await answerCallbackQuery(botToken, query.id);
    }

    // Handle pre-checkout query
    if (update.pre_checkout_query) {
      const query = update.pre_checkout_query;
      console.log("Pre-checkout query received:", query.id);
      
      try {
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
      } catch (e) {
        await answerPreCheckoutQuery(botToken, query.id, false, "Ошибка обработки заказа");
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
