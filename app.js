const express=require("express");
const app=express();
const mongoose=require("mongoose");
const path=require("path");
const port=8080;
app.set("views",path.join(__dirname,"views"));
app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")))
app.use(express.urlencoded({ extended: true }));
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
const ejsMate=require("ejs-mate");
app.engine("ejs",ejsMate);
const nodeNotifier=require("node-notifier");
nodeNotifier.notify({ appID: "Node.js" });
app.use(express.urlencoded({extended: true}));
app.use(express.json());
const Feedback=require("./model/feedback.js");

//requiring ExpressError class
const ExpressError=require('./utils/ExpressError.js');
//requiring wrapaync
const WrapAsync = require("./utils/WrapAsync.js");

//requiring feedbackSchema for Joi 
const feedbackSchema=require("./feedbackSchema.js");
const loginSchema=require("./loginSchema.js");
const userAccountSchema=require("./userAccountSchema.js");


//database
const mongoURL = "mongodb://127.0.0.1:27017/GrowAi";
const UserLogin=require("./model/login.js")
const User=require("./model/userAccount.js");


async function main(){
    await mongoose.connect(mongoURL);
}

main().then((req,res)=>{
    console.log("connection with database successful")
})
    .catch((err)=>{
        console.log(err);
    })



app.get("/home",WrapAsync (async (req,res)=>{
    
    let feedback=await Feedback.find();
    res.render("home.ejs",{feedback});


}))

//login page
app.get("/login",(req,res)=>{
    res.render("login.ejs");

})




//create new account page


app.get("/createAccount",(req,res)=>{
    res.render("createAccount.ejs");

})
//using feedbackSchema function to handle the validation Error
let validateUserAccount = (req, res, next) => {
    const {error} = userAccountSchema.validate(req.body);

    if (error) {
        const errMsg = error.details.map(el => el.message);
        throw new ExpressError(400, errMsg);
    }
    next();
};

app.post("/createAccount",WrapAsync(async (req,res)=>{
    let{email,password,changePassword}=req.body.user;
    let user= new User(req.body.user);
    await user.save();
    res.redirect("/login");
}))
//using feedbackSchema function to handle the validation Error
let validateLogin = (req, res, next) => {
    const {error} = loginSchema.validate(req.body);

    if (error) {
        const errMsg = error.details.map(el => el.message);
        throw new ExpressError(400, errMsg);
    }
    next();
};

app.post("/login",WrapAsync(async (req, res) => {
    let { email, pass } = req.body;
    console.log(req.body);

    let user = await User.findOne({ email: email });

    if (!user) {
     res.send("User doesn;t exits")   
    }

    if (user.password === pass) {
        res.redirect("/home");
    } else {
        // nodeNotifier.notify({
        //     title:"my app",
        //     message:"Incorrect Password",
        //     sound:true,
        //     wait:true,
        //     appID: "My Super Cool App"
        // })
        res.send("incoredct")
    }
}));



// practice page
app.get("/practice",(req,res)=>{
    res.render("practice.ejs");
})

// Feedback Dashboard Page
app.get("/dashboard",(req,res)=>{
    res.render("dashboard.ejs");
})

//resume analysis page
app.get("/resume-analysis",(req,res)=>{
    res.render("resume.ejs");
})
app.get("/problem-set",(req,res)=>{
    res.render("problemSet.ejs");
})
app.get("/Gowthami",(req,res)=>{
    res.render("Gowthami.ejs");
})

app.get("/profile",(req,res)=>{
    res.render("profile.ejs")
})

app.get("/feedback",(req,res)=>{
    res.render("feedback.ejs")
})

//using feedbackSchema function to handle the validation Error
let validateFeedback = (req, res, next) => {
    console.log(req.body.feedback.rating);
    console.log(req.body.feedback.comment);
    const {error} = feedbackSchema.validate(req.body);

    if (error) {
        const errMsg = error.details.map(el => el.message);
        throw new ExpressError(400, errMsg);
    }
    next();
};



app.post("/feedback",validateFeedback,WrapAsync(async (req,res)=>{
    console.log(req.body);
    let {rating,comment}=req.body.feedback;
    console.log(rating);
    console.log(comment);

    let feeback1=new Feedback({
        rating:rating,
        comment:comment,
        createdAt:new Date()
    })

    await feeback1.save();
    res.redirect("/home");

}))


// app.use((err,req,res,next)=>{
//     let {status=500,message="Something Went Wrong"}=err;
//     res.status(status).render("error.ejs",{message});
// })

app.listen(port,()=>{
    console.log("Server is listening at the port 8080");
})


