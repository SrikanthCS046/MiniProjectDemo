const mongoose=require("mongoose");
const googleUserSchema=mongoose.Schema({
    googleId:{
        type:String,
        required:true
    },
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    photo:{
        type:String
    }

});

module.exports=mongoose.model("GoogleUser",googleUserSchema);
