import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { WalletSetupForm } from "@/components/auth/wallet-setup-form";

export default async function WalletSetupPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <WalletSetupForm lang={user.language} />;
}
