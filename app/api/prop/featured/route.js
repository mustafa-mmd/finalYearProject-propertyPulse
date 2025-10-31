import connectDB from "@/config/database";
import Property from "@/models/property";


export const GET=async(request)=>{
  //get /api/prop/featured
try{
  await connectDB();
  const properties=await Property.find({
    is_featured:true
  })
  

  return new Response(JSON.stringify(properties),{status:200})
}catch(err){
  console.log(err);
return new Response('something went wrong',{status:500})
}
}