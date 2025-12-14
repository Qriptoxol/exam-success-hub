import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileId, subjectIds } = await req.json();

    if (!profileId || !subjectIds || !Array.isArray(subjectIds) || subjectIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing profileId or subjectIds" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get subjects with prices
    const { data: subjects, error: subjectsError } = await supabase
      .from("subjects")
      .select("id, title, price")
      .in("id", subjectIds);

    if (subjectsError || !subjects || subjects.length === 0) {
      console.error("Error fetching subjects:", subjectsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subjects" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate total amount
    const totalAmount = subjects.reduce((sum, s) => sum + s.price, 0);

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        profile_id: profileId,
        total_amount: totalAmount,
        status: "pending",
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      return new Response(
        JSON.stringify({ error: "Failed to create order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create order items
    const orderItems = subjects.map((subject) => ({
      order_id: order.id,
      subject_id: subject.id,
      price: subject.price,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Error creating order items:", itemsError);
      // Rollback order
      await supabase.from("orders").delete().eq("id", order.id);
      return new Response(
        JSON.stringify({ error: "Failed to create order items" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clear cart for this user
    await supabase
      .from("cart_items")
      .delete()
      .eq("profile_id", profileId)
      .in("subject_id", subjectIds);

    console.log("Order created successfully:", order.id);

    return new Response(
      JSON.stringify({
        success: true,
        order: {
          ...order,
          items: subjects,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in create-order:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
