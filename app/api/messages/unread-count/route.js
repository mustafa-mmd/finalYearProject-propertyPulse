import connectDB from "@/config/database";
import Message from "@/models/Message";
import { getSessionUser } from "@/utils/getSessionUser";
import { ReturnDocument } from "mongodb";

export const dynamic='force-dynamic';

//GET/api/messages/unread-count
export const PUT=async (request)=>{
  try{
  await connectDB();
 
  if(!sessionUser || !sessionUser.user){
      return new Response("User id is required",{status:401})
    }

    const {userId}=sessionUser;

     const count= await Message.countDocuments({
recipient:userId,
read:false,
     })

    return new Response(JSON.stringify(count),{status:200});

  }catch(err){
console.log(err);
return new Response('something went wrong',{status:500});
  }
}
