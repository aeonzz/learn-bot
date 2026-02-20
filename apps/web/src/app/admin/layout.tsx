import AdminHeader from "@/components/admin-header";
import { auth } from "@learn-bot/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || session.user.role !== "admin") {
    redirect("/login");
  }

  return (
    <main>
      <AdminHeader />
      {children}
    </main>
  );
}
