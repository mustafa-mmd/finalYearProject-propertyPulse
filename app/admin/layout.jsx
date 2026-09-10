import AdminSidebar from "@/components/admin/AdminSidebar";
import { visibleAdminItems } from "@/config/admin";
import { requireAdminPageAccess } from "@/utils/pageAuthorization";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }) {
  const actor = await requireAdminPageAccess("/admin");
  const visible = visibleAdminItems(actor.permissions);

  return (
    <div className="min-h-screen bg-[#f4f6fa]">
      <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">
        <div className="lg:hidden">
          <details className="rounded-2xl bg-slate-950 p-4 text-white">
            <summary className="cursor-pointer font-bold">Admin navigation</summary>
            <div className="mt-4">
              <AdminSidebar items={visible} actor={{ name: actor.name, email: actor.email }} />
            </div>
          </details>
        </div>
        <div className="hidden lg:block">
          <AdminSidebar items={visible} actor={{ name: actor.name, email: actor.email }} />
        </div>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
