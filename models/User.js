// import {Schema,model,models} from "mongoose";
// import { unique } from "next/dist/build/utils";
// const UserSchema = new Schema({
//   email:{
//     type:String,
//     unique:true,
//     required:[true,"Please provide an email"],
//   },
//   name:{
//     type:String,
//     required:[true,"Please provide a name"],
//   },
//   image:{
//     type:String,
    
//   },
//   bookmarks:[{
//     type:Schema.Types.ObjectId, 
//     ref:"properties",
//   }],
// },{timestamps:true});
// const User = models.User || model("User",UserSchema);
// export default User;



import { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  email: { 
    type: String, 
    unique: true,  // ✅ This already creates an index
    required: [true, "Please provide an email"],
    lowercase: true,
    trim: true,
  },
  name: { 
    type: String, 
    required: [true, "Please provide a name"],
    trim: true,
    maxlength: 30,
  },
  image: { 
    type: String,
    default: "",
  },
  bookmarks: [{ 
    type: Schema.Types.ObjectId, 
    ref: "Property" 
  }],
}, { 
  timestamps: true 
});


// Prevent OverwriteModelError
const User = models.User || model("User", UserSchema);

export default User;