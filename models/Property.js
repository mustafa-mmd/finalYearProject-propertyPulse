import {Schema,model,models} from "mongoose";
const PropertySchema = new Schema({
  owner:[{
    type:Schema.Types.ObjectId,
    ref:"User",
    required:true,}],
    name:{
    type:String,  
    required:[true,"Please provide a name"],
  },
  type:{
    type:String,  
    required:[true,"Please provide a type"],
  },
  description:{
    type:String,  
    
  },
  location:{
    street:{
      type:String,
      
    },
    city:{
      type:String,
      
    },
    state:{
      type:String,
      
    },
    zipcode:{
      type:String,
  }
},
beds:{
    type:Number,
    required:[true,"Please provide number of beds"]
  },
  baths:{
    type:Number,
    required:[true,"Please provide number of baths"]
  },
  square_feet:{
    type:Number,
    required:[true,"Please provide square feet"]
  },
  amenities:[{
    type:String,
  }],
  rates:{
    nightly:{
      type:Number,
      required:[true,"Please provide nightly rate"]
    },
    weekly:{
      type:Number,
      required:[true,"Please provide weekly rate"]
    },
    monthly:{
      type:Number,
      required:[true,"Please provide monthly rate"]
    }
  },
  seller_info:{
    name:{
      type:String,
      
    },
    email:{
      type:String,
      
    },
    phone:{
      type:String,
      
    }
  },
  images:[{
    type:String,
    
  }],
  is_featured:{
    type:Boolean,
    default:false,
  },
},{timestamps:true});

const Property = models.properties || model("properties",PropertySchema);
export default Property;