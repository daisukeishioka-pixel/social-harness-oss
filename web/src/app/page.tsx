import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase-server";

export default async function Home() {
  const user = await getSession();

  if (user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
