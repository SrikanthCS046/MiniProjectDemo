const mongoose=require("mongoose");
const feedbackSchema=mongoose.Schema({
    rating:{
        type:Number,
        min:1,
        max:5
    },
    comment:{
        type:String,
    },
    createdAt:{
        type:Date,
        default:Date.now()
    }
});

const Feedback=mongoose.model("Feedback",feedbackSchema);
module.exports=Feedback;
