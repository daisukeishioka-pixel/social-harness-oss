import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase-server";

export default async function Home() {
  try {
    const user = await getSession();
    if (user) {
      redirect("/dashboard");
    }
  } catch {
    // Supabase not configured or session check failed
  }

  redirect("/login");
}
