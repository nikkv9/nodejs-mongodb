const express = require("express");
const app = express();
require("dotenv/config");
const bodyParser = require("body-parser");
const port = process.env.PORT || 5000;
const path = require("path");
require("./database/db");
const User = require("./models/user");
const db = process.env.DB;
const session = require("express-session");
const MongodbStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");

// storing sessions in mongodb
const store = new MongodbStore({
  uri: db,
  collection: "sessions",
});

// prevent csrf attacks
const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "multerImg");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
// for serving template engine (ejs) files
app.set("view engine", "ejs");
app.set("views", "views");

const shopRoutes = require("./routes/shop");
const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/auth");
const errorCtrlr = require("./controllers/error");

app.use(bodyParser.urlencoded({ extended: false }));
// for serving files from public folder (css,js etc.)
app.use(express.static(path.join(__dirname, "public")));

app.use(express.static(path.join(__dirname, "multerImg")));
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);

// generate session
app.use(
  session({
    secret: "webdsasecret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

// csrf
app.use(csrfProtection);

// flash error message
app.use(flash());

// checking user existence
app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch((err) => {
      console.log(err);
    });
});

// session and csrf
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

// for ejs, page not found
app.use(errorCtrlr.getPageNotFound);

app.listen(port, (req, res) => {
  console.log(`server is running at ${port}`);
});
