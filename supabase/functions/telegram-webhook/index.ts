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
  successful_payment?: {
    currency: string;
    total_amount: number;
    invoice_payload: string;
    telegram_payment_charge_id: string;
    provider_payment_charge_id: string;
  };
}

async function sendTelegramMessage(botToken: string, chatId: number, text: string) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
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
        `🛒 Нажмите кнопку ниже, чтобы открыть каталог и сделать заказ.`
      );
    }

    // Handle pre-checkout query (Telegram Payments)
    if (update.pre_checkout_query) {
      const query = update.pre_checkout_query;
      console.log("Pre-checkout query received:", query.id);
      
      // Validate the order exists
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
        
        // Update order status
        const { error } = await supabase
          .from("orders")
          .update({
            status: "paid",
            telegram_payment_charge_id: payment.telegram_payment_charge_id,
          })
          .eq("id", payload.orderId);

        if (error) {
          console.error("Error updating order:", error);
        }

        // Get order items to send to user
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("subject:subjects(title, full_content)")
          .eq("order_id", payload.orderId);

        // Send confirmation and content
        await sendTelegramMessage(
          botToken,
          chatId,
          `✅ <b>Оплата получена!</b>\n\n` +
          `Спасибо за покупку! Ваши материалы:\n\n` +
          (orderItems?.map((item: any) => 
            `📖 <b>${item.subject?.title}</b>`
          ).join("\n") || "Материалы будут отправлены отдельным сообщением.")
        );

        // Mark order as delivered
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
