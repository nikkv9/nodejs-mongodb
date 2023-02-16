const Product = require("../models/product");

// // get add product page
exports.getAddProduct = (req, res) => {
  // let msg = req.flash("error");
  // if (msg.length > 0) {
  //   msg = msg[0];
  // } else {
  //   msg = null;
  // }
  res.render("admin/addProduct", {
    pageTitle: "Add Product",
    path: "/admin/addProduct",
    // isAuthenticated: req.session.isLoggedIn,
    errorMsg: null,
  });
};
// // add product functionality
exports.postAddProduct = (req, res) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  console.log(image);
  if (!image) {
    return res.render("admin/addProduct", {
      pageTitle: "add product",
      path: "/admin/addProduct",
      product: {
        title: title,
        price: price,
        description: description,
      },
      errorMsg: "Attached file is not an image!",
    });
  }

  const imageUrl = image.filename;

  Product.create({
    title: title,
    imageUrl: imageUrl,
    price: price,
    description: description,
    userId: req.user,
  })
    .then(() => {
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
    });
};

// get admin product page
exports.getAdminProduct = (req, res) => {
  Product.find({ userId: req.user._id })
    // .populate("userId")
    .then((products) => {
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
        // isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// get edit product page
exports.getEditProduct = (req, res) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return res.redirect("/");
      }
      res.render("admin/editProduct", {
        pageTitle: "Edit Product",
        path: "/admin/editProduct",
        product: product,
        // isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// edit product functionality
exports.postEditProduct = (req, res) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const image = req.file;
  const updatedPrice = req.body.price;
  const updatedDescription = req.body.description;

  Product.findById(prodId)
    .then((product) => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect("/");
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDescription;
      if (image) {
        product.imageUrl = image.filename;
      }
      return product.save().then(() => {
        res.redirect("/admin/products");
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// // delete product functionality
exports.deleteProduct = (req, res) => {
  const prodId = req.body.productId;
  Product.deleteOne({ _id: prodId, userId: req.user._id })
    .then(() => {
      res.redirect("/admin/products");
    })
    .catch((err) => {
      console.log(err);
    });
};
