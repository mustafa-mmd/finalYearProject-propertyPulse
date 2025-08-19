import connectDB from "@/config/database";
import Message from "@/models/Message";
import { getSessionUser } from "@/utils/getSessionUser";
import { ReturnDocument } from "mongodb";

export const dynamic='force-dynamic';

//put/api/messages/:id
export const PUT=async (request,{params})=>{
  try{
  await connectDB();
  const {id}=params;
  if(!sessionUser || !sessionUser.user){
      return new Response("User id is required",{status:401})
    }

    const {userId}=sessionUser;
    const message=await Message.findById(id);
    if(!message)return new Response('Message not found',{
      status:404
    });

    //verify ownership
    if(message.recipient.toString()!==userId){
      return new Response('UnAthorized ',{status:401});
    }
    //update message to read,unread depending on the current status
    message.read=!message.read;
    await message.save();
    return new Response(JSON.stringify(message),{status:200});

  }catch(err){
console.log(err);
return new Response('something went wrong',{status:500});
  }
}


//delete/api/message/:id
export const DELETE=async (request,{params})=>{
  try{
  await connectDB();
  const {id}=params;
  if(!sessionUser || !sessionUser.user){
      return new Response("User id is required",{status:401})
    }

    const {userId}=sessionUser;
    const message=await Message.findById(id);
    if(!message)return new Response('Message not found',{
      status:404
    });

    //verify ownership
    if(message.recipient.toString()!==userId){
      return new Response('UnAthorized ',{status:401});
    }
    
    await message.deleteOne();



    return new Response('Message Deleted',{status:200});

  }catch(err){
console.log(err);
return new Response('something went wrong',{status:500});
  }
}