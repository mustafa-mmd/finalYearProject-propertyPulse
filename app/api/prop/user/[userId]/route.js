import connectDB from "@/config/database";
import Property from "@/models/property";

export const GET=async(request,{params})=>{
  //get /api/prop/user/:userid
try{
  await connectDB();
  const userId=params.userId;
  if(!userId){
    return new Response("userId is required",{status:400})
  }
  const properties=await Property.find({owner:userId})
  
  return new Response(JSON.stringify(properties),{status:200})
}catch(err){
  console.log(err);
return new Response('something went wrong',{status:500})
}
}