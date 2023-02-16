const express = require("express");
const router = express.Router();

const shopCtrlr = require("../controllers/shop");
const isAuth = require("../middlewares/isAuth");

// // for ejs files
router.get("/", shopCtrlr.getIndex);

router.get("/products", shopCtrlr.getProducts);

router.get("/products/:productId", shopCtrlr.getProduct);

router.post("/cart", isAuth, shopCtrlr.postCart);

router.get("/cart", isAuth, shopCtrlr.getCart);

router.post("/deleteCartProduct", isAuth, shopCtrlr.deleteCartProduct);

router.get("/checkout", isAuth, shopCtrlr.getCheckout);

router.get("/checkout/cancel", isAuth, shopCtrlr.getCheckout);

router.get("/checkout/success", isAuth, shopCtrlr.postOrder);

router.get("/orders", isAuth, shopCtrlr.getOrder);

// router.post("/createOrder", isAuth, shopCtrlr.postOrder);

// // // render html files
// // router.get("/", (req, res) => {
// //   console.log(adminRoutes.products);
// //   res.sendFile(path.join(__dirname, "../views/html/shop.html"));
// // });

module.exports = router;
