import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Subject = Database["public"]["Tables"]["subjects"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Order = Database["public"]["Tables"]["orders"]["Row"];
type CartItem = Database["public"]["Tables"]["cart_items"]["Row"];
type Favorite = Database["public"]["Tables"]["favorites"]["Row"];

// Subjects
export async function getSubjects(category?: string) {
  let query = supabase.from("subjects").select("*").eq("is_active", true);

  if (category === "popular") {
    query = query.eq("is_popular", true);
  } else if (category === "ege") {
    query = query.eq("exam_type", "ЕГЭ");
  } else if (category === "oge") {
    query = query.eq("exam_type", "ОГЭ");
  }

  const { data, error } = await query.order("is_popular", { ascending: false });
  
  if (error) {
    console.error("Error fetching subjects:", error);
    throw error;
  }
  
  return data;
}

export async function getSubjectById(id: string) {
  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching subject:", error);
    throw error;
  }

  return data;
}

// Cart
export async function getCartItems(profileId: string) {
  const { data, error } = await supabase
    .from("cart_items")
    .select(`
      *,
      subject:subjects(*)
    `)
    .eq("profile_id", profileId);

  if (error) {
    console.error("Error fetching cart:", error);
    throw error;
  }

  return data;
}

export async function addToCart(profileId: string, subjectId: string) {
  const { data, error } = await supabase
    .from("cart_items")
    .upsert(
      { profile_id: profileId, subject_id: subjectId },
      { onConflict: "profile_id,subject_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("Error adding to cart:", error);
    throw error;
  }

  return data;
}

export async function removeFromCart(profileId: string, subjectId: string) {
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("profile_id", profileId)
    .eq("subject_id", subjectId);

  if (error) {
    console.error("Error removing from cart:", error);
    throw error;
  }
}

export async function clearCart(profileId: string) {
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("profile_id", profileId);

  if (error) {
    console.error("Error clearing cart:", error);
    throw error;
  }
}

// Favorites
export async function getFavorites(profileId: string) {
  const { data, error } = await supabase
    .from("favorites")
    .select(`
      *,
      subject:subjects(*)
    `)
    .eq("profile_id", profileId);

  if (error) {
    console.error("Error fetching favorites:", error);
    throw error;
  }

  return data;
}

export async function toggleFavorite(profileId: string, subjectId: string) {
  // Check if already favorited
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("profile_id", profileId)
    .eq("subject_id", subjectId)
    .maybeSingle();

  if (existing) {
    // Remove favorite
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("id", existing.id);

    if (error) throw error;
    return false;
  } else {
    // Add favorite
    const { error } = await supabase
      .from("favorites")
      .insert({ profile_id: profileId, subject_id: subjectId });

    if (error) throw error;
    return true;
  }
}

// Orders
export async function getOrders(profileId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items(
        *,
        subject:subjects(*)
      )
    `)
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }

  return data;
}

export async function createOrder(profileId: string, subjectIds: string[]) {
  const { data, error } = await supabase.functions.invoke("create-order", {
    body: { profileId, subjectIds },
  });

  if (error) {
    console.error("Error creating order:", error);
    throw error;
  }

  return data;
}

// Profile stats
export async function getProfileStats(profileId: string) {
  const { data: orders, error } = await supabase
    .from("orders")
    .select("total_amount, status")
    .eq("profile_id", profileId)
    .in("status", ["paid", "delivered"]);

  if (error) {
    console.error("Error fetching profile stats:", error);
    throw error;
  }

  const totalSpent = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
  const orderCount = orders?.length || 0;

  return { totalSpent, orderCount };
}
