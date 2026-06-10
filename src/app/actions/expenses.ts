"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ExpenseInput = {
  description: string;
  amount: number;
  category_id: string | null;
  currency: "ARS" | "USD";
  date: string;
};

// Crear un gasto
export async function addExpense(input: ExpenseInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado. Inicie sesión nuevamente." };
  }

  const { description, amount, category_id, currency, date } = input;

  if (!description || !amount || !currency || !date) {
    return { error: "Todos los campos obligatorios deben ser completados." };
  }

  if (amount <= 0) {
    return { error: "El monto debe ser mayor a 0." };
  }

  const { data, error } = await supabase.from("expenses").insert({
    user_id: user.id,
    description,
    amount,
    category_id: category_id || null,
    currency,
    date,
  }).select().single();

  if (error) {
    console.error("Error adding expense:", error);
    return { error: "Ocurrió un error al registrar el gasto." };
  }

  // Revalidar las rutas del dashboard y gastos para actualizar cache
  revalidatePath("/");
  revalidatePath("/expenses");

  return { success: true, data };
}

// Actualizar un gasto existente
export async function updateExpense(id: string, input: ExpenseInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado. Inicie sesión nuevamente." };
  }

  const { description, amount, category_id, currency, date } = input;

  if (!description || !amount || !currency || !date) {
    return { error: "Todos los campos obligatorios deben ser completados." };
  }

  if (amount <= 0) {
    return { error: "El monto debe ser mayor a 0." };
  }

  const { data, error } = await supabase
    .from("expenses")
    .update({
      description,
      amount,
      category_id: category_id || null,
      currency,
      date,
    })
    .eq("id", id)
    .eq("user_id", user.id) // Seguridad adicional: asegurar pertenencia del registro
    .select()
    .single();

  if (error) {
    console.error("Error updating expense:", error);
    return { error: "Ocurrió un error al actualizar el gasto." };
  }

  // Revalidar
  revalidatePath("/");
  revalidatePath("/expenses");

  return { success: true, data };
}

// Eliminar un gasto
export async function deleteExpense(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado. Inicie sesión nuevamente." };
  }

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id); // Seguridad adicional: asegurar pertenencia del registro

  if (error) {
    console.error("Error deleting expense:", error);
    return { error: "Ocurrió un error al eliminar el gasto." };
  }

  // Revalidar
  revalidatePath("/");
  revalidatePath("/expenses");

  return { success: true };
}
