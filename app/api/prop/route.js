import connectDB from "@/config/database";
import Property from "../../../models/Property";
export const GET=async(request)=>{
  //get /api/prop
try{
  await connectDB();
  const properties=await Property.find({})
  
  return new Response(JSON.stringify(properties),{status:200})
}catch(err){
  console.log(err);
return new Response('something went wrong',{status:500})
}
}