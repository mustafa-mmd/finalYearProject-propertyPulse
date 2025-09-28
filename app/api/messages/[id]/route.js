import connectDB from "@/config/database";
import Message from "@/models/Message";
import { getSessionUser } from "@/utils/getSessionUser";

export const dynamic = "force-dynamic";

// PUT /api/messages/:id
export const PUT = async (request, { params }) => {
  try {
    await connectDB();
    const sessionUser = await getSessionUser();

    if (!sessionUser || !sessionUser.user) {
      return new Response(JSON.stringify({ message: "User id is required" }), {
        status: 401,
      });
    }

    const { id } = params;
    const userId = sessionUser.user.id;

    const message = await Message.findById(id);
    if (!message) {
      return new Response(JSON.stringify({ message: "Message not found" }), {
        status: 404,
      });
    }

    if (message.recipient.toString() !== userId) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    message.read = !message.read;
    await message.save();

    return new Response(JSON.stringify({ read: message.read }), {
      status: 200,
    });
  } catch (err) {
    console.error("PUT /api/messages/[id] error:", err);
    return new Response(JSON.stringify({ message: "Something went wrong" }), {
      status: 500,
    });
  }
};

// DELETE /api/messages/:id
export const DELETE = async (request, { params }) => {
  try {
    await connectDB();
    const sessionUser = await getSessionUser();

    if (!sessionUser || !sessionUser.user) {
      return new Response(JSON.stringify({ message: "User id is required" }), {
        status: 401,
      });
    }

    const { id } = params;
    const userId = sessionUser.user.id;

    const message = await Message.findById(id);
    if (!message) {
      return new Response(JSON.stringify({ message: "Message not found" }), {
        status: 404,
      });
    }

    if (message.recipient.toString() !== userId) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    await message.deleteOne();

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("DELETE /api/messages/[id] error:", err);
    return new Response(JSON.stringify({ message: "Something went wrong" }), {
      status: 500,
    });
  }
};

