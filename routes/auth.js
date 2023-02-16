const express = require("express");
const router = express.Router();

const authCtrlr = require("../controllers/auth");

const { check, body } = require("express-validator");
const User = require("../models/user");

router.get("/login", authCtrlr.getLogin);

router.post("/login", authCtrlr.postLogin);

router.get("/signup", authCtrlr.getSignup);

router.post(
  "/signup",
  [
    check("email")
      .isEmail()
      .withMessage("enter a valid email!")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("email exists already!");
          }
        });
      })
      .normalizeEmail(),
    body(
      "password",
      "Please enter a password with only numbers and text and atleast 3 characters"
    )
      .isLength({ min: 3 })
      .isAlphanumeric()
      .trim(),
    body("confirmPassword")
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Password do not match!");
        }
        return true;
      }),
  ],
  authCtrlr.postSignup
);

router.post("/logout", authCtrlr.postLogout);

router.get("/reset", authCtrlr.getReset);

router.post("/reset", authCtrlr.postReset);

router.get("/reset/:token", authCtrlr.getNewPass);

router.post("/new-pass", authCtrlr.postNewPass);

module.exports = router;
