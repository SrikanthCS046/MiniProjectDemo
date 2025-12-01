const mongoose=require("mongoose");
const Schema=mongoose.Schema;
const loginSchema=new Schema({
    email:{
        type:String,
        require:true
    },
    pass : {
        type:String,
        require:true
    }
})
const UserLogin=mongoose.model("UserLogin",loginSchema);
module.exports=UserLogin;