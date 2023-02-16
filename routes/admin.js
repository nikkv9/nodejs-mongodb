const express = require("express");
const router = express.Router();

const adminCtrlr = require("../controllers/admin");
const isAuth = require("../middlewares/isAuth");

// // for ejs files
router.get("/addProduct", isAuth, adminCtrlr.getAddProduct);

router.post("/addProduct", isAuth, adminCtrlr.postAddProduct);

router.get("/products", isAuth, adminCtrlr.getAdminProduct);

router.get("/editProduct/:productId", isAuth, adminCtrlr.getEditProduct);

router.post("/editProduct", isAuth, adminCtrlr.postEditProduct);

router.post("/delete", isAuth, adminCtrlr.deleteProduct);

// // render html files
// // router.get("/addProduct", (req, res) => {
// //   res.sendFile(path.join(__dirname, "../views/html/addProduct.html"));
// // });
module.exports = router;
