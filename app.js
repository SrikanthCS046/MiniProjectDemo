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
app.get("/home",(req,res)=>{
    res.render("home.ejs");
})
app.get("/login",(req,res)=>{
    res.render("login.ejs");
})

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


app.listen(port,()=>{
    console.log("Server is listening at the port 8080");
})


