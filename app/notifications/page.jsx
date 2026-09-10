import { redirect } from "next/navigation";
import connectDB from "@/config/database";
import Notification from "@/models/Notification";
import NotificationActions from "@/components/NotificationActions";
import { getActor } from "@/utils/authorization";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Notifications",
  description: "Your platform notifications and alerts.",
};

const TYPE_ICONS = {
  BOOKING: "📅",
  APPLICATION: "📋",
  MESSAGE: "💬",
  PAYMENT: "💳",
  VERIFICATION: "🛡️",
  SYSTEM: "⚙️",
  MAINTENANCE: "🔧",
  OFFER: "💰",
  VIEWING: "🏠",
};

export default async function NotificationsPage() {
  const actor = await getActor();
  if (!actor) redirect("/api/auth/signin?callbackUrl=/notifications");

  await connectDB();
  const items = await Notification.find({
    recipientId: actor.id,
    archivedAt: { $exists: false },
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const unread = items.filter((n) => !n.readAt);
  const read = items.filter((n) => n.readAt);

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-3xl px-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="pp-page-header">
            <p className="pp-page-header__eyebrow">Activity</p>
            <h1 className="pp-page-header__title">
              Notifications
              {unread.length > 0 && (
                <span className="ml-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {unread.length}
                </span>
              )}
            </h1>
          </div>
          {items.length > 0 && <NotificationActions />}
        </div>

        {items.length === 0 && (
          <div className="pp-empty mt-8">
            <div className="pp-empty__icon text-3xl">🔔</div>
            <p className="pp-empty__title">All caught up!</p>
            <p className="pp-empty__body">No notifications at this time.</p>
          </div>
        )}

        {/* Unread */}
        {unread.length > 0 && (
          <div className="mt-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
              New ({unread.length})
            </p>
            <div className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm divide-y divide-slate-100">
              {unread.map((item) => (
                <Link
                  key={item._id.toString()}
                  href={item.href || "#"}
                  className="flex gap-4 p-5 hover:bg-blue-50/60 transition-colors"
                >
                  <span className="mt-0.5 text-2xl">
                    {TYPE_ICONS[item.type] || "🔔"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-bold text-slate-950 leading-snug">{item.title}</h2>
                      <time className="shrink-0 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleString("en-ZA", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 line-clamp-2">{item.body}</p>
                  </div>
                  <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Read */}
        {read.length > 0 && (
          <div className="mt-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
              Earlier ({read.length})
            </p>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
              {read.map((item) => (
                <Link
                  key={item._id.toString()}
                  href={item.href || "#"}
                  className="flex gap-4 p-5 text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  <span className="mt-0.5 text-2xl opacity-60">
                    {TYPE_ICONS[item.type] || "🔔"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-semibold text-slate-700 leading-snug">{item.title}</h2>
                      <time className="shrink-0 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleString("en-ZA", {
                          day: "numeric",
                          month: "short",
                        })}
                      </time>
                    </div>
                    <p className="mt-1 text-sm line-clamp-2">{item.body}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
