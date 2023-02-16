const User = require("../models/user");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const EMAIL = process.env.EMAIL;
const PASS = process.env.APP_PASS;

// crypto is a built in method in nodejs
// token generating through email with crypto
const crypto = require("crypto");

const { validationResult } = require("express-validator");

// to get google app password -
// google account -> security -> set 2 step verfication -> app password -> select app (custom name-nodemailer)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL,
    pass: PASS,
  },
});

// get signup page
exports.getSignup = (req, res) => {
  let msg = req.flash("error");
  // console.log(req.flash("error"));
  if (msg.length > 0) {
    msg = msg[0];
  } else {
    msg = null;
  }
  res.render("auth/signup", {
    pageTitle: "signup page",
    path: "/signup",
    // isAuthenticated: false,
    errorMsg: msg,
    oldInput: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationError: [],
  });
};

// signup functionality
exports.postSignup = (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const cPassword = req.body.confirmPassword;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // console.log(errors.array());
    return res.status(422).render("auth/signup", {
      pageTitle: "signup page",
      path: "/signup",
      errorMsg: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: cPassword,
      },
      validationError: errors.array(),
    });
  }

  bcrypt
    .hash(password, 12)
    .then((hashPass) => {
      User.create({
        email: email,
        password: hashPass,
        cart: { items: [] },
      });
    })
    .then(() => {
      res.redirect("/login");
      return transporter.sendMail({
        from: EMAIL,
        to: email,
        subject: "Signup succeeded!",
        html: `<h1> successfully signed up!</h1>
                      Now you can use our app`,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// get login page
exports.getLogin = (req, res) => {
  //   console.log(req.session.isLoggedIn);
  let msg = req.flash("error");
  if (msg.length > 0) {
    msg = msg[0];
  } else {
    msg = null;
  }
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login page",
    errorMsg: msg,
    // isAuthenticated: false,
    oldInput: {
      email: "",
      password: "",
    },
  });
};

// login functionality
exports.postLogin = (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      pageTitle: "login page",
      path: "/login",
      errorMsg: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
      },
    });
  }

  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        req.flash("error", "invalid email or password");
        return res.status(422).render("auth/login", {
          pageTitle: "login page",
          path: "/login",
          errorMsg: "invalid email or password",
          oldInput: {
            email: email,
            password: password,
          },
        });
      } else {
        bcrypt
          .compare(password, user.password)
          .then((doMatch) => {
            if (doMatch) {
              req.session.isLoggedIn = true;
              req.session.user = user;
              return req.session.save((err) => {
                if (err) {
                  console.log(err);
                }
                res.redirect("/");
              });
            }
            req.flash("error", "invalid email or password");
            return res.status(422).render("auth/login", {
              pageTitle: "login page",
              path: "/login",
              errorMsg: "invalid email or password",
              oldInput: {
                email: email,
                password: password,
              },
            });
          })
          .catch((err) => {
            console.log(err);
            return res.redirect("/login");
          });
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

// logout functionality
exports.postLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/");
    }
  });
};

// get reset password page
exports.getReset = (req, res) => {
  let msg = req.flash("error");
  if (msg.length > 0) {
    msg = msg[0];
  } else {
    msg = null;
  }
  res.render("auth/reset", {
    pageTitle: "reset password",
    path: "/reset",
    errorMsg: msg,
  });
};

// email send for reset functionality
exports.postReset = (req, res) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset");
    }
    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash("error", "Invalid email!");
          return res.redirect("/reset");
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then(() => {
        res.redirect("/");
        return transporter.sendMail({
          from: EMAIL,
          to: req.body.email,
          subject: "Passoword reset!",
          html: `<h3> You requested for reset the password</h3>
                <p>Click this <a href='http://localhost:5000/reset/${token}'>link </a> to set the new password </p>`,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

// get new password page
exports.getNewPass = (req, res) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then((user) => {
      let msg = req.flash("error");
      if (msg.length > 0) {
        msg = msg[0];
      } else {
        msg = null;
      }
      res.render("auth/new-password", {
        pageTitle: "new password",
        path: "/new-pass",
        errorMsg: msg,
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// new password functionality
exports.postNewPass = (req, res) => {
  const newPass = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(newPass, 12);
    })
    .then((hashPass) => {
      resetUser.password = hashPass;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(() => {
      res.redirect("/login");
    })
    .catch((err) => {
      console.log(err);
    });
};
