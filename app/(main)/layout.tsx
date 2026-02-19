import { redirect } from "next/navigation";
import { checkPasswordGate } from "@/app/actions/auth";
import { LockScreen } from "@/components/LockScreen";
import { BottomNav } from "@/components/BottomNav";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const allowed = await checkPasswordGate();
  if (!allowed) {
    return <LockScreen />;
  }

  return (
    <div className="min-h-dvh flex flex-col bg-stone-50 dark:bg-stone-950">
      <main className="flex-1 pb-20 pb-safe">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
