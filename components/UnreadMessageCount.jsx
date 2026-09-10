"use client";
import { useEffect } from "react";
import { useGlobalContext } from "@/context/globalContext";

export default function UnreadMessageCount({ session }) {
  const { unreadCount, setUnreadCount } = useGlobalContext();
  useEffect(() => {
    if (!session) return undefined;
    let active = true;
    const refresh = async () => { try { const response = await fetch("/api/messages/unread-count"); if (response.ok && active) setUnreadCount(await response.json()); } catch {} };
    void refresh();
    const source = new EventSource(`/api/conversations/stream?since=${encodeURIComponent(new Date().toISOString())}`);
    source.onmessage = (event) => { try { if (JSON.parse(event.data).type === "messages") void refresh(); } catch {} };
    return () => { active = false; source.close(); };
  }, [session, setUnreadCount]);
  return unreadCount > 0 ? <span className="absolute right-0 top-0 inline-flex -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-red-600 px-2 py-1 text-xs font-bold leading-none text-white">{unreadCount}</span> : null;
}
