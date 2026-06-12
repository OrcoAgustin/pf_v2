"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ProfileInput = {
  displayName: string;
  preferredCurrency: "ARS" | "USD";
};

export async function updateProfile(input: ProfileInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado. Inicie sesión nuevamente." };
  }

  const { displayName, preferredCurrency } = input;

  if (!displayName.trim()) {
    return { error: "El nombre para mostrar es obligatorio." };
  }

  if (displayName.length > 50) {
    return { error: "El nombre no puede superar los 50 caracteres." };
  }

  if (preferredCurrency !== "ARS" && preferredCurrency !== "USD") {
    return { error: "Moneda de preferencia inválida." };
  }

  // Actualizar la tabla profiles de Supabase
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      display_name: displayName.trim(),
      preferred_currency: preferredCurrency,
    })
    .eq("id", user.id);

  if (profileError) {
    console.error("Error updating profile in db:", profileError);
    return { error: "Ocurrió un error al actualizar los datos en el perfil." };
  }

  // Actualizar displayName en la metadata del usuario de Supabase Auth
  const { error: authError } = await supabase.auth.updateUser({
    data: { display_name: displayName.trim() },
  });

  if (authError) {
    console.error("Error updating auth metadata:", authError);
    // No fallamos catastróficamente si falla auth metadata, porque la DB es la fuente de la verdad,
    // pero es bueno registrarlo.
  }

  // Revalidar las rutas para actualizar la barra lateral y los dashboards
  revalidatePath("/");
  revalidatePath("/expenses");
  revalidatePath("/installments");
  revalidatePath("/categories");
  revalidatePath("/profile");

  return { success: true };
}

export async function updatePassword(password: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autorizado. Inicie sesión nuevamente." };
  }

  if (!password || password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  // Actualizar contraseña en Supabase Auth
  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    console.error("Error updating password:", error);
    return { error: "Ocurrió un error al actualizar la contraseña: " + error.message };
  }

  return { success: true };
}
