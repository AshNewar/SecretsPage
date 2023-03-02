//jshint esversion:6
require("dotenv").config();
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const app=express();
const mongoose=require("mongoose");
const encrypt=require("mongoose-encryption");
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
mongoose.set('strictQuery',false);
const uri="mongodb://0.0.0.0:27017/Secret";
mongoose.connect(uri,{useNewUrlParser:true});
const scheme=new mongoose.Schema({
    email:String,
    password:String
});
scheme.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});
const data=mongoose.model("data",scheme);
const port=process.env.PORT || 3000;
app.listen(port,function(){
    console.log("Server Started");
});
app.get("/",function(req,res){
    res.render("home");

});
app.get("/login",function(req,res){
    res.render("login");

});
app.get("/register",function(req,res){
    res.render("register");

});
app.post("/register",function(req,res){
    const user=req.body.username;
    const password=req.body.password;
    const item=new data({
        email:user,
        password:password
    });
    item.save();
    res.render("secrets");

});
app.post("/login",async(req,res)=>{
    try{
        const username=req.body.username;
        const password=req.body.password;
        const ele=await data.findOne({email:username});
        if(ele){
            if(ele.password===password){
                res.render("secrets");
            }
            else{
                res.send("OPPS wrong password");
            }
        }
        else{
            res.send("Error Wrong Data");
        }
    }catch(err){
        console.log(err);
    }
});
