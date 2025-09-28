
'use client';
import { useState } from "react";
import { toast } from "react-toastify";
import { useGlobalContext } from "@/context/globalContext";

const Message = ({ message }) => {
  const [isRead, setIsRead] = useState(!!message.read);
  const [isDeleted, setIsDeleted] = useState(false);

  const { setUnreadCount } = useGlobalContext();

  // ---- Handle Mark As Read / New ----
  const handleReadClick = async () => {
    try {
      const res = await fetch(`/api/messages/${message._id}`, {
        method: "PUT",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update read status");

      const { read } = data;
      setIsRead(read);

      setUnreadCount((prev) => {
        if (read) return Math.max(0, prev - 1);
        return prev + 1;
      });

      toast.success(read ? "Marked as read" : "Marked as new");
    } catch (err) {
      console.error("handleReadClick error", err);
      toast.error(err.message || "Something went wrong while updating message");
    }
  };

  // ---- Handle Delete ----
  const handleDeleteClick = async () => {
    try {
      const res = await fetch(`/api/messages/${message._id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete message");

      setIsDeleted(true);
      setUnreadCount((prev) => (isRead ? prev : Math.max(0, prev - 1)));

      toast.success("Message deleted");
    } catch (err) {
      console.error("handleDeleteClick error", err);
      toast.error(err.message || "Message could not be deleted");
    }
  };

  if (isDeleted) return null;

  return (
    <div className="relative bg-white p-4 rounded-md shadow-md border border-gray-200">
      {!isRead && (
        <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-md">
          New
        </div>
      )}

      <h2 className="text-xl mb-4">
        <span className="font-bold">Property Inquiry:</span>{" "}
        {message.property?.name ?? "—"}
      </h2>

      <p className="text-gray-700">{message.body}</p>

      <ul className="mt-4 space-y-1">
        <li>
          <strong>Name:</strong>{" "}
          {message.sender?.username ??
            message.sender?.name ??
            message.name ??
            "—"}
        </li>

        <li>
          <strong>Reply Email:</strong>{" "}
          {message.email ? (
            <a
              href={`mailto:${message.email}`}
              className="text-blue-500 underline"
            >
              {message.email}
            </a>
          ) : (
            "—"
          )}
        </li>

        <li>
          <strong>Reply Phone:</strong>{" "}
          {message.phone ? (
            <a
              href={`tel:${message.phone}`}
              className="text-blue-500 underline"
            >
              {message.phone}
            </a>
          ) : (
            "—"
          )}
        </li>

        <li>
          <strong>Received:</strong>{" "}
          {message.createdAt
            ? new Date(message.createdAt).toLocaleString()
            : "—"}
        </li>
      </ul>

      <div className="mt-4 flex space-x-3">
        <button
          onClick={handleReadClick}
          className={`${
            isRead ? "bg-gray-300" : "bg-blue-500 text-white"
          } py-1 px-3 rounded-md`}
        >
          {isRead ? "Mark As New" : "Mark As Read"}
        </button>

        <button
          onClick={handleDeleteClick}
          className="bg-red-500 text-white py-1 px-3 rounded-md"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default Message;
