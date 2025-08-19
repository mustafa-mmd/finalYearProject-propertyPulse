// import connectDB from "@/config/database";
// import Property from "@/models/Property";
// import { getSessionUser } from "@/utils/getSessionUser";
// export const GET=async(request,{params})=>{
//   //delete/api/prop/:id
// try{
//   await connectDB();
//   const property=await Property.findById(params.id);
//   if (!property) {
//     return new Response('Property not found', { status: 404 });
//   }
  
//   return new Response(JSON.stringify(property),{status:200})
// }catch(err){
//   console.log(err);
// return new Response('something went wrong',{status:500})
// }
// }



// export const DELETE=async(request,{params})=>{
//   //get /api/prop/:id
// try{
//   const propertyId=params.id;
//   const sessionUser=await getSessionUser();
//   //check for session
//   if(!sessionUser || !sessionUser.userid){
//     return new Response("userid is required",{status:401})
//   }
//   const {userId}=sessionUser;
//   await connectDB();
//   const property=await Property.findById(propertyId);
//   if (!property) {
//     return new Response('Property not found', { status: 404 });
//   }
//   //verify ownership
//   if(property.owner.toString() !== userId){
// return new Response("unathorized",{status:401})
//   }

//   await property.deleteOne();

//   return new Response("property deleted",{status:200})
// }catch(err){
//   console.log(err);
// return new Response('something went wrong',{status:500})
// }
// }

// //Put api/prop/:id
// export const PUT=async(request,{params})=>{
//   try{
//     await connectDB();
    
//     const sessionUser=await getSessionUser();
//     if(!sessionUser || !sessionUser.userId){
//       return new Response("user ID is required",{status:401})
//     }
//     const {id}=params;
//     const {userId}=sessionUser;
//     const formData=await request.formData();
//     //access all value from amenities 
//     const amenities=formData.getAll('amenities')
//     //get property to update
// const existingProperty=await Property.findById(id);

// if(!existingProperty){
//   return new Response("property does not exist ",{status:404})
// }

// //check verify ownership

// if(existingProperty.owner.toString()! ==userId){
// return new Response("unathorized",{status:401})
// }

// //create propertydata Object for database
// const propertyData={
//   type:formData.get("type"),
//   name:formData.get("name"),
//   description:formData.get("description"),
//   location:{
//     street:formData.get("location.street"),
//     city:formData.get("location.city"),
//     state:formData.get("location.state"),
//     zipcode:formData.get("location.zipcode"),
//   },
//   beds:formData.get("beds"),
//   baths:formData.get("baths"),
//   square_feet:formData.get("square_feet"),
//   amenities,
//   rates:{
//     weekly:formData.get('rates.weekly'),
//     monthly:formData.get('rates.monthly'),
//      nigthly:formData.get('rates.nigthly'),
//   },
//   seller_info:{
//     name:formData.get('seller_info.name'),
//     email:formData.get('seller_info.email'),
//     phone:formData.get('seller_info.phone'),
//   },
//   owner:userId,
 
// }

// //update property in databse
// const updatedProperty= await Property.findByIdAndUpdate(id,propertyData);

//     return new Response(JSON.stringify(updatedProperty),{status:200})
//   }catch(err){
// return new Response("failed to add property",{status:500})
//   }

// }




import connectDB from "@/config/database";
import Property from "@/models/Property";
import { getSessionUser } from "@/utils/getSessionUser";

// GET /api/prop/:id
export const GET = async (request, { params }) => {
  try {
    await connectDB();
    const property = await Property.findById(params.id);

    if (!property) {
      return new Response("Property not found", { status: 404 });
    }

    return new Response(JSON.stringify(property), { status: 200 });
  } catch (err) {
    console.log(err);
    return new Response("Something went wrong", { status: 500 });
  }
};

// DELETE /api/prop/:id
export const DELETE = async (request, { params }) => {
  try {
    const propertyId = params.id;
    const sessionUser = await getSessionUser();

    // check for session
    if (!sessionUser || !sessionUser.userId) {
      return new Response("User ID is required", { status: 401 });
    }

    const { userId } = sessionUser;

    await connectDB();
    const property = await Property.findById(propertyId);

    if (!property) {
      return new Response("Property not found", { status: 404 });
    }

    // verify ownership
    if (property.owner.toString() !== userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    await property.deleteOne();

    return new Response("Property deleted", { status: 200 });
  } catch (err) {
    console.log(err);
    return new Response("Something went wrong", { status: 500 });
  }
};

// PUT /api/prop/:id
export const PUT = async (request, { params }) => {
  try {
    await connectDB();

    const sessionUser = await getSessionUser();
    if (!sessionUser || !sessionUser.userId) {
      return new Response("User ID is required", { status: 401 });
    }

    const { id } = params;
    const { userId } = sessionUser;

    const formData = await request.formData();

    // access all values from amenities
    const amenities = formData.getAll("amenities");

    // get property to update
    const existingProperty = await Property.findById(id);

    if (!existingProperty) {
      return new Response("Property does not exist", { status: 404 });
    }

    // verify ownership
    if (existingProperty.owner.toString() !== userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    // create propertyData object for database
    const propertyData = {
      type: formData.get("type"),
      name: formData.get("name"),
      description: formData.get("description"),
      location: {
        street: formData.get("location.street"),
        city: formData.get("location.city"),
        state: formData.get("location.state"),
        zipcode: formData.get("location.zipcode"),
      },
      beds: formData.get("beds"),
      baths: formData.get("baths"),
      square_feet: formData.get("square_feet"),
      amenities,
      rates: {
        nightly: formData.get("rates.nightly"),
        weekly: formData.get("rates.weekly"),
        monthly: formData.get("rates.monthly"),
      },
      seller_info: {
        name: formData.get("seller_info.name"),
        email: formData.get("seller_info.email"),
        phone: formData.get("seller_info.phone"),
      },
      owner: userId,
    };

    // update property in database
    const updatedProperty = await Property.findByIdAndUpdate(id, propertyData, {
      new: true,
    });

    return new Response(JSON.stringify(updatedProperty), { status: 200 });
  } catch (err) {
    console.log(err);
    return new Response("Failed to update property", { status: 500 });
  }
};


