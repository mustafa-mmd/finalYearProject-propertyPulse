"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { FaPaperPlane, FaArchive, FaFlag, FaUser, FaInfoCircle } from "react-icons/fa";
import UserAvatar from "@/components/UserAvatar";

export default function ConversationInbox() {
  const params = useSearchParams();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(params.get("conversation") || "");
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/conversations");
      const payload = await response.json();
      if (response.ok) {
        setConversations(payload.data);
        setSelected((value) => value || payload.data[0]?._id || "");
      }
    } catch (err) {
      console.error("Failed to load conversations", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (id) => {
    if (!id) return;
    try {
      const response = await fetch(`/api/conversations/${id}/messages`);
      const payload = await response.json();
      if (response.ok) {
        setMessages(payload.data);
      }
    } catch (err) {
      console.error("Failed to load messages", err);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    void loadMessages(selected);
  }, [selected, loadMessages]);

  // Server-Sent Events for real-time updates
  useEffect(() => {
    let source;
    let stopped = false;
    const connect = () => {
      if (stopped) return;
      source = new EventSource(
        `/api/conversations/stream?since=${encodeURIComponent(new Date().toISOString())}`
      );
      source.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "messages") {
          void loadConversations();
          if (data.conversationIds.includes(selected)) {
            void loadMessages(selected);
          }
        }
      };
      source.onerror = () => {
        source.close();
        if (!stopped) setTimeout(connect, 1500);
      };
    };
    connect();
    return () => {
      stopped = true;
      source?.close();
    };
  }, [selected, loadConversations, loadMessages]);

  const send = async (event) => {
    event.preventDefault();
    const text = body.trim();
    if (!text) return;
    setBody("");
    const response = await fetch(`/api/conversations/${selected}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    if (!response.ok) {
      setBody(text);
      return toast.error("Message could not be sent");
    }
    await Promise.all([loadMessages(selected), loadConversations()]);
  };

  const action = async (actionName) => {
    const reason = actionName === "REPORT" ? window.prompt("Explain the issue") : undefined;
    if (actionName === "REPORT" && !reason) return;
    const response = await fetch(`/api/conversations/${selected}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: actionName, reason }),
    });
    if (!response.ok) return toast.error("Conversation action failed");
    toast.success(`Conversation ${actionName.toLowerCase()}d`);
    await loadConversations();
  };

  const current = conversations.find((item) => item._id === selected);

  if (loading) {
    return (
      <div className="flex min-h-[600px] items-center justify-center p-12 text-slate-500">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <p className="font-semibold text-slate-700">Loading conversations…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-[700px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl lg:grid-cols-[360px_1fr]">
      
      {/* Sidebar: Conversations List */}
      <aside className="border-r border-slate-200 bg-slate-50/50 flex flex-col">
        <div className="border-b border-slate-200 p-6 bg-white">
          <h1 className="text-2xl font-black text-slate-950">Messages</h1>
          <p className="text-sm text-slate-500 mt-1">Live, private property inquiries</p>
        </div>
        
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[600px]">
          {conversations.map((item) => {
            const isActive = selected === item._id;
            return (
              <button
                key={item._id}
                onClick={() => setSelected(item._id)}
                className={`block w-full text-left p-5 transition-all duration-150 ${
                  isActive
                    ? "bg-blue-50/80 border-l-4 border-blue-600 pl-4"
                    : "hover:bg-slate-100/50"
                }`}
              >
                <div className="flex justify-between items-start">
                  <p className="font-bold text-slate-900 truncate flex-1 pr-2">
                    {item.subject}
                  </p>
                  <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                    {new Date(item.lastMessageAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1.5 truncate text-sm text-slate-600 font-medium">
                  {item.lastMessagePreview || "Conversation started"}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-full">
                    {item.status}
                  </span>
                </div>
              </button>
            );
          })}
          {!conversations.length && (
            <div className="p-8 text-center text-slate-500">
              <FaInfoCircle className="mx-auto text-3xl text-slate-300 mb-2" />
              <p className="font-medium">No conversations yet.</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <section className="flex min-w-0 flex-col bg-slate-50">
        {current ? (
          <>
            {/* Header */}
            <header className="flex items-center justify-between border-b border-slate-200 bg-white p-5">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 leading-tight">{current.subject}</h2>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {current.status}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => action("ARCHIVE")}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <FaArchive /> Archive
                </button>
                <button
                  onClick={() => action("REPORT")}
                  className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <FaFlag /> Report
                </button>
              </div>
            </header>

            {/* Messages Body */}
            <div className="flex-1 space-y-4 overflow-y-auto p-6 max-h-[500px]">
              {messages.map((message, index) => {
                const sender = message.senderId;
                const senderName = sender?.name || "User";
                const senderImage = sender?.image;
                
                // Safe string ID checks
                const isOwn = String(sender?._id || sender) === String(currentUserId);

                return (
                  <div
                    key={message._id || index}
                    className={`flex items-end gap-2.5 ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    {/* User profile picture if not own */}
                    {!isOwn && (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-md overflow-hidden">
                        <UserAvatar
                          src={senderImage}
                          alt={senderName}
                          className="h-full w-full rounded-full object-cover"
                          width={36}
                          height={36}
                        />
                      </div>
                    )}

                    <div className="flex flex-col max-w-[70%]">
                      {/* Name Label */}
                      {!isOwn && (
                        <span className="text-[11px] font-bold text-slate-500 ml-1.5 mb-1">
                          {senderName}
                        </span>
                      )}

                      {/* Bubble */}
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-all duration-200 ${
                          isOwn
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.body}</p>
                      </div>

                      {/* Timestamp / Read receipt */}
                      <span
                        className={`text-[10px] text-slate-400 mt-1 font-semibold ${
                          isOwn ? "text-right mr-1.5" : "text-left ml-1.5"
                        }`}
                      >
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {isOwn && ` · read by ${message.readBy?.length || 1}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Form */}
            <form onSubmit={send} className="flex gap-3 border-t border-slate-200 bg-white p-5">
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                maxLength={5000}
                rows={2}
                placeholder="Write your message here..."
                className="flex-1 resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-400"
              />
              <button
                disabled={!body.trim()}
                className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Send <FaPaperPlane className="text-xs" />
              </button>
            </form>
          </>
        ) : (
          <div className="grid flex-1 place-items-center text-slate-500 py-20">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-slate-400 text-2xl">
                <FaInfoCircle />
              </div>
              <p className="font-semibold text-slate-700">Choose a conversation to view messages</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
