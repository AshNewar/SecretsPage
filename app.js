//jshint esversion:6
require("dotenv").config();
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const app=express();
const mongoose=require("mongoose");
const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
var GoogleStrategy = require('passport-google-oauth20').Strategy;
// const bcrypt=require("bcrypt");
// const saltRound=10;
// const md5=require("md5");
// const encrypt=require("mongoose-encryption");
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());


mongoose.set('strictQuery',false);
const uri="mongodb://0.0.0.0:27017/Secret";
mongoose.connect(uri,{useNewUrlParser:true});
const scheme=new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secret:String
});
scheme.plugin(passportLocalMongoose);
// scheme.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});
const data=mongoose.model("data",scheme);
passport.use(data.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });
const port=process.env.PORT || 3000;
app.listen(port,function(){
    console.log("Server Started");
});
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, done) {
    data.findOne({ googleId: profile.id }, function (err, user) {
        if(err){
            return done(err);
        }
        if(!user){
            user=new data({
                name:profile.displayName,
                // email: profile.emails[0].value,
                username: profile.username,
                provider: 'google',
                //now in the future searching on User.findOne({'facebook.id': profile.id } will match because of this next line
                google: profile._json
             });
             user.save(function(err) {
                if (err) console.log(err);
                return done(err, user);
            });
        } else {
            //found user. Return
            return done(err, user);
        }
    });
  }
));
app.get("/",function(req,res){
    res.render("home");

});
app.get("/login",function(req,res){
    res.render("login");

});
app.get("/register",function(req,res){
    res.render("register");

});
app.get("/secrets",function(req,res){
    data.find({"secret":{$ne:null}},function(err,obj){
        if(err){
            console.log(err);
        }else{
            res.render("secrets",{list:obj});
        }
    });
    
});
app.get("/logout",function(req,res){
    req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
    });
});
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })); 
app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets page.
    res.redirect('/secrets');
  });
app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    }
    else{
        res.redirect("/login");
    }
  });
app.post("/register",function(req,res){
    data.register({username:req.body.username},req.body.password,function(err,result){
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else{
            //This sends cookie to the database
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });

        }

    });




    // const user=req.body.username;
    // const password=req.body.password;
    // bcrypt.hash(password,saltRound,function(err,hash){
    //     const item=new data({
    //         email:user,
    //         password:hash
    //     });
    //     item.save();
    //     res.render("secrets");

    // });
});

app.post("/login",function(req,res){
    const item=new data({
        username:req.body.username,
        password:req.body.password
    });
    req.login(item,function(err){
        if(err){
            console.log(err);
        }
        else{
            //This sends cookie to the database
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    })
});
app.post("/submit",function(req,res){
    const secret=req.body.secret;
    data.findById(req.user.id,function(err,obj){
        if(err){
            console.log(err);
        }
        else{
            if(obj){
                obj.secret=secret;
                obj.save();
                res.redirect("/secrets");
            }
        }
    });
});




// app.post("/login",async(req,res)=>{
    // try{
    //     const username=req.body.username;
    //     const password=req.body.password;
        
    //     const ele=await data.findOne({email:username});
    //     if(ele){
    //         bcrypt.compare(password,ele.password,function(err,obj){
    //             if(obj){
    //                 res.render("secrets");
    //             }
    //             else{
    //                 res.send("OPPS wrong password");
    //             }
    //         });
    //     }
    //     else{
    //         res.send("Error Wrong Data");
    //     }
    // }catch(err){
    //     console.log(err);
    // }
// });
