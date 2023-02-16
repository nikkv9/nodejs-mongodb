const mongoose = require("mongoose");
const db = process.env.DB;

mongoose
  .connect(db)
  .then((result) => {
    console.log("database is connected!");
  })
  .catch((err) => {
    console.log(err);
  });
