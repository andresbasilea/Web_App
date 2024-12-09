//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
// const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');

// facebook LOGIN





const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "El secreto oculto.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/agoutiUsers", {
  useNewUrlParser: true
});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  nombre: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});




// FACEBOOK Y GOOGLE STRATEGY

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID_GOOGLE,
    clientSecret: process.env.CLIENT_SECRET_GOOGLE,
    callbackURL: "http://localhost:3000/auth/google/agouti",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    //console.log(profile);
    // console.log(profile.name.givenName);

    User.findOrCreate({
      googleId: profile.id,
      username: profile.givenName,
      nombre: profile.name.givenName
    }, function(err, user) {
      // console.log("Hola " + profile.name.givenName + "!");
      return cb(err, user);
    });
  }
));


// twitter STRATEGY

passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: "http://localhost:3000/auth/twitter/agouti"
  },
  function(token, tokenSecret, profile, cb) {
    User.findOrCreate({
       twitterId: profile.id
       // username: profile.givenName,
       // nombre: profile.name.givenName
     }, function (err, user) {
      return cb(err, user);
    });
  }
));















// passport.use(new FacebookStrategy({
//     clientID: process.env.CLIENT_ID_FACEBOOK,
//     clientSecret: process.env.CLIENT_SECRET_FACEBOOK,
//     callbackURL: "http://localhost:3000/auth/facebook/agouti"
//   },
//   function(accessToken, refreshToken, profile, done) {
//     User.findOrCreate({
//       facebookId: profile.id
//     }, function(err, user) {
//       return done(err, user);
//     });
//   }
// ));









// APP GET

// LOGINS

app.get("/", function(req, res) {
  res.render("home");
});

app.get("/auth/google",
  passport.authenticate('google', {
    scope: ["profile"]
  })
);

app.get("/auth/google/agouti",
  passport.authenticate('google', {
    failureRedirect: "/login"
  }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    // console.log(req.user.googleId);
    res.redirect("/exito");
  });



app.get('/auth/twitter',
  passport.authenticate('twitter'
  // {  scope: ["profile"]}
  )
);

app.get("/auth/twitter/agouti",
  passport.authenticate('twitter', {
    failureRedirect: "/login"
  }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/exito");
  });

















// app.get("/auth/facebook",
//   passport.authenticate('facebook', {
//     scope: ["profile"]
//   })
// );
//
// app.get("/auth/facebook/agouti",
//   passport.authenticate('facebook', {
//     failureRedirect: "/login"
//   }),
//   function(req, res) {
//     // Successful authentication, redirect to secrets.
//     res.redirect("/exito");
//   });

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});


app.get("/nosotros", function(req, res){
  res.render("nosotros");
});


app.get("/contacto", function(req, res){
  res.render("contacto");
});


app.get("/perfil", function(req,res){
  res.render("perfil");
});


app.get("/contenido", function(req,res){
  res.render("contenido");
});





// app.get("/images/video1.mp4",function(req,res){
//   res.render("video1.mp4");
// });


// app.get("/secrets", function(req, res){
//   User.find({"secret": {$ne: null}}, function(err, foundUsers){
//     if (err){
//       console.log(err);
//     } else {
//       if (foundUsers) {
//         res.render("secrets", {usersWithSecrets: foundUsers});
//       }
//     }
//   });
// });

app.get("/submit", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", function(req, res) {
  const submittedSecret = req.body.secret;

  //Once the user is authenticated and their session gets saved, their user details are saved to req.user.
  // console.log(req.user.id);

  User.findById(req.user.id, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(function() {
          res.redirect("/secrets");
        });
      }
    }
  });
});

app.get("/farmacologia", function(req,res){
  res.render("farmacologia");
});

app.get("/farmacologia_preview", function(req,res){
  res.render("farmacologia_preview");
});

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

app.post("/register", function(req, res) {

  User.register({
    username: req.body.username,
    nombre: req.body.nombre
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        // console.log(nombre);
        res.redirect("/exito");
      });
    }
  });

});


app.get("/exito", function(req, res){

  if(req.isAuthenticated()){
    console.log(req);
    res.render("exito", {userName: req.user.nombre});
  }else{
    res.redirect("/login");
  }
});




  // User.find({"name": {$ne: null}}, function(err, foundUsers){
  //   if (err){
  //     console.log(err);
  //   } else {
  //     if (foundUsers) {
  //       res.render("exito", {usersList: foundUsers});
  //     }
  //   }
  // });





app.post("/login", function(req, res) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/exito");
      });
    }
  });

});


// module.exports = User;

app.listen(3000, function() {
  console.log("Server started on port 3000.");
});
