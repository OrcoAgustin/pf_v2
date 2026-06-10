"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type InstallmentPurchaseInput = {
  description: string;
  total_amount: number;
  total_installments: number;
  interest_rate: number;
  currency: "ARS" | "USD";
  start_date: string;
  category_id: string | null;
};

// Crear una compra en cuotas y generar sus gastos individuales
export async function addInstallmentPurchase(input: InstallmentPurchaseInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado. Inicie sesión nuevamente." };
  }

  const { description, total_amount, total_installments, interest_rate, currency, start_date, category_id } = input;

  if (!description || !total_amount || !total_installments || !currency || !start_date) {
    return { error: "Todos los campos obligatorios deben ser completados." };
  }

  if (total_amount <= 0) {
    return { error: "El monto total debe ser mayor a 0." };
  }

  if (total_installments <= 0) {
    return { error: "La cantidad de cuotas debe ser mayor a 0." };
  }

  if (interest_rate < 0) {
    return { error: "La tasa de interés no puede ser negativa." };
  }

  // 1. Insertar compra en cuotas
  const { data: purchase, error: purchaseError } = await supabase
    .from("purchases_installments")
    .insert({
      user_id: user.id,
      description,
      total_amount,
      total_installments,
      interest_rate,
      currency,
      start_date,
      category_id: category_id || null,
    })
    .select()
    .single();

  if (purchaseError) {
    console.error("Error creating installment purchase:", purchaseError);
    return { error: "Ocurrió un error al registrar la compra en cuotas." };
  }

  // 2. Ejecutar la función RPC para generar las cuotas individuales en 'expenses'
  const { error: rpcError } = await supabase.rpc("generate_installment_expenses", {
    p_purchase_id: purchase.id,
  });

  if (rpcError) {
    console.error("Error calling generate_installment_expenses RPC:", rpcError);
    // Intentamos limpiar la compra si falló la generación de cuotas para no dejar datos inconsistentes
    await supabase.from("purchases_installments").delete().eq("id", purchase.id);
    return { error: "Ocurrió un error al generar las cuotas individuales." };
  }

  // Revalidar caché de Next.js
  revalidatePath("/");
  revalidatePath("/expenses");
  revalidatePath("/installments");

  return { success: true, data: purchase };
}

// Actualizar una compra en cuotas (elimina cuotas anteriores y las regenera)
export async function updateInstallmentPurchase(id: string, input: InstallmentPurchaseInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado. Inicie sesión nuevamente." };
  }

  const { description, total_amount, total_installments, interest_rate, currency, start_date, category_id } = input;

  if (!description || !total_amount || !total_installments || !currency || !start_date) {
    return { error: "Todos los campos obligatorios deben ser completados." };
  }

  if (total_amount <= 0) {
    return { error: "El monto total debe ser mayor a 0." };
  }

  if (total_installments <= 0) {
    return { error: "La cantidad de cuotas debe ser mayor a 0." };
  }

  if (interest_rate < 0) {
    return { error: "La tasa de interés no puede ser negativa." };
  }

  // 1. Eliminar gastos individuales de cuota asociados anteriormente
  // (Hacemos esto explícitamente ya que al actualizar la compra no se disparan cascadas automáticamente,
  // y queremos regenerarlas por completo para reflejar cualquier cambio en monto, cuotas, fecha, etc.)
  const { error: deleteExpensesError } = await supabase
    .from("expenses")
    .delete()
    .eq("installment_purchase_id", id)
    .eq("user_id", user.id);

  if (deleteExpensesError) {
    console.error("Error deleting old installment expenses:", deleteExpensesError);
    return { error: "Ocurrió un error al actualizar las cuotas asociadas." };
  }

  // 2. Actualizar registro principal
  const { data: purchase, error: purchaseError } = await supabase
    .from("purchases_installments")
    .update({
      description,
      total_amount,
      total_installments,
      interest_rate,
      currency,
      start_date,
      category_id: category_id || null,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (purchaseError) {
    console.error("Error updating installment purchase:", purchaseError);
    return { error: "Ocurrió un error al actualizar la compra en cuotas." };
  }

  // 3. Volver a generar los gastos mensuales
  const { error: rpcError } = await supabase.rpc("generate_installment_expenses", {
    p_purchase_id: id,
  });

  if (rpcError) {
    console.error("Error calling generate_installment_expenses RPC on update:", rpcError);
    return { error: "La compra se actualizó, pero falló la regeneración de cuotas." };
  }

  // Revalidar paths
  revalidatePath("/");
  revalidatePath("/expenses");
  revalidatePath("/installments");

  return { success: true, data: purchase };
}

// Eliminar una compra en cuotas (la base de datos eliminará los gastos en cascada)
export async function deleteInstallmentPurchase(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado. Inicie sesión nuevamente." };
  }

  const { error } = await supabase
    .from("purchases_installments")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting installment purchase:", error);
    return { error: "Ocurrió un error al eliminar la compra en cuotas." };
  }

  // Revalidar paths
  revalidatePath("/");
  revalidatePath("/expenses");
  revalidatePath("/installments");

  return { success: true };
}
