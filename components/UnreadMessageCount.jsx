'use client';
import { useState, useEffect } from "react";
import { useGlobalContext } from "@/context/globalContext";

const UnreadMessageCount = ({ session }) => {
  const { unreadCount, setUnreadCount } = useGlobalContext();

  useEffect(() => {
    if (!session) return;

    const fetchUnreadMessages = async () => {
      try {
        const res = await fetch('/api/messages/unread-count');
        
        console.log("📊 Unread count response status:", res.status);
        
        if (res.ok) {
          const data = await res.json();
          console.log("✅ Unread count received:", data);
          setUnreadCount(data);
        } else {
          console.error("❌ Failed to fetch unread count:", res.status);
        }
      } catch (err) {
        console.error("💥 Error fetching unread count:", err);
      }
    };

    fetchUnreadMessages();

    // Set up polling for real-time updates
    const interval = setInterval(fetchUnreadMessages, 30000); // Check every 30 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [session, setUnreadCount]); // Added dependencies

  return (
    unreadCount > 0 && (
      <span className='absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full'>
        {unreadCount}
      </span>
    )
  );
};

export default UnreadMessageCount;