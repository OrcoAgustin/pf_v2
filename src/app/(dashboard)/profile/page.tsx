import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const supabase = await createClient();

  // Obtener el usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Obtener el perfil asociado para display_name y preferred_currency
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, preferred_currency")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
    // Si no hay perfil, creamos datos por defecto seguros
  }

  const profileData = {
    email: user.email || "",
    displayName: profile?.display_name || user.user_metadata?.display_name || user.email?.split("@")[0] || "Usuario",
    preferredCurrency: (profile?.preferred_currency || "ARS") as "ARS" | "USD",
  };

  return (
    <ProfileClient
      email={profileData.email}
      initialDisplayName={profileData.displayName}
      initialPreferredCurrency={profileData.preferredCurrency}
    />
  );
}
