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




// User.js
import { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  email: { type: String, unique: true, required: [true, "Please provide an email"] },
  name: { type: String, required: [true, "Please provide a name"] },
  image: { type: String },
  bookmarks: [{ type: Schema.Types.ObjectId, ref: "properties" }],
}, { timestamps: true });

const User = models.User || model("User", UserSchema);
export default User;
