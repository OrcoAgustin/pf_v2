"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CategoryInput = {
  name: string;
  icon: string;
  color: string;
};

// Validar que el color sea un hex color válido (ej. #FFFFFF o #FFF)
function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{3,8}$/.test(color);
}

// Crear una categoría custom
export async function addCategory(input: CategoryInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado. Inicie sesión nuevamente." };
  }

  const { name, icon, color } = input;

  if (!name.trim() || !icon.trim() || !color.trim()) {
    return { error: "Todos los campos son obligatorios." };
  }

  if (name.length > 50) {
    return { error: "El nombre de la categoría no puede superar los 50 caracteres." };
  }

  if (!isValidHexColor(color)) {
    return { error: "Formato de color inválido. Debe ser un código hexadecimal (Ej: #FF6B6B)." };
  }

  // Insertar la categoría asociada al usuario
  const { data, error } = await supabase
    .from("categories")
    .insert({
      name: name.trim(),
      icon: icon.trim(),
      color: color.trim(),
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating category:", error);
    return { error: "Ocurrió un error al crear la categoría." };
  }

  // Revalidar las rutas del dashboard, gastos, cuotas y categorías
  revalidatePath("/");
  revalidatePath("/expenses");
  revalidatePath("/installments");
  revalidatePath("/categories");

  return { success: true, data };
}

// Actualizar una categoría custom
export async function updateCategory(id: string, input: CategoryInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado. Inicie sesión nuevamente." };
  }

  const { name, icon, color } = input;

  if (!name.trim() || !icon.trim() || !color.trim()) {
    return { error: "Todos los campos son obligatorios." };
  }

  if (name.length > 50) {
    return { error: "El nombre de la categoría no puede superar los 50 caracteres." };
  }

  if (!isValidHexColor(color)) {
    return { error: "Formato de color inválido. Debe ser un código hexadecimal (Ej: #FF6B6B)." };
  }

  // Actualizar la categoría verificando que sea del usuario actual
  // Las políticas RLS también protegen esto, pero es una buena práctica del lado del servidor.
  const { data, error } = await supabase
    .from("categories")
    .update({
      name: name.trim(),
      icon: icon.trim(),
      color: color.trim(),
    })
    .eq("id", id)
    .eq("user_id", user.id) // Solo modificar categorías propias (no globales)
    .select()
    .single();

  if (error) {
    console.error("Error updating category:", error);
    return { error: "Ocurrió un error al actualizar la categoría o no tiene permisos." };
  }

  // Revalidar rutas
  revalidatePath("/");
  revalidatePath("/expenses");
  revalidatePath("/installments");
  revalidatePath("/categories");

  return { success: true, data };
}

// Eliminar una categoría custom
export async function deleteCategory(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado. Inicie sesión nuevamente." };
  }

  // Eliminar la categoría verificando propiedad (user_id = user.id)
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting category:", error);
    return { error: "Ocurrió un error al eliminar la categoría o no tiene permisos." };
  }

  // Revalidar rutas
  revalidatePath("/");
  revalidatePath("/expenses");
  revalidatePath("/installments");
  revalidatePath("/categories");

  return { success: true };
}
