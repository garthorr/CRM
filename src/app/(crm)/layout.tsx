import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          userEmail={session.user?.email}
          userName={session.user?.name}
        />
        <main className="flex-1 overflow-y-auto p-6 bg-neutral-50">
          {children}
        </main>
      </div>
    </div>
  );
}
