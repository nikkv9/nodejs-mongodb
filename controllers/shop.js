const Order = require("../models/order");
const Product = require("../models/product");
const STRIPE_KEY = process.env.STRIPE_SK;

const stripe = require("stripe")(STRIPE_KEY);

const ITEMS_PER_PAGE = 1;

// // get home page
exports.getIndex = (req, res) => {
  // console.log(req);
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((product) => {
      res.render("shop/index", {
        prods: product,
        pageTitle: "Shop",
        path: "/",
        // isAuthenticated: req.session.isLoggedIn,
        currentPage: page,
        hasNextPage: totalItems > ITEMS_PER_PAGE * page,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// // get all product list page
exports.getProducts = (req, res) => {
  Product.find()
    .then((product) => {
      res.render("shop/productList", {
        prods: product,
        pageTitle: "All products",
        path: "/products",
        // isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// // get selected product page
exports.getProduct = (req, res) => {
  const id = req.params.productId;
  Product.findById(id)
    .then((product) => {
      res.render("shop/productDetail", {
        prods: product,
        pageTitle: "All products",
        path: "/products",
        // isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// add product to cart functionality
exports.postCart = (req, res) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((prod) => {
      return req.user.addToCart(prod);
    })
    .then((result) => {
      // console.log(result);
      res.redirect("/cart");
    })
    .catch((err) => {
      console.log(err);
    });
};

// get cart page
exports.getCart = (req, res) => {
  // productId is not just id but it returns whole details of a product
  req.user.populate("cart.items.productId").then((user) => {
    // console.log(user.cart.items);
    const products = user.cart.items;
    res.render("shop/cart", {
      path: "/cart",
      pageTitle: "your cart",
      products: products,
      // isAuthenticated: req.session.isLoggedIn,
    });
  });
};

// delete product from cart functionality
exports.deleteCartProduct = (req, res) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(() => {
      res.redirect("/cart");
    })
    .catch((err) => {
      console.log(err);
    });
};

// get checkout page
exports.getCheckout = (req, res) => {
  let products;
  let total = 0;
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      products = user.cart.items;
      // total = 0;
      products.forEach((p) => {
        total += p.quantity * p.productId.price;
      });

      // stripe
      return stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: products.map((p) => {
          return {
            name: p.productId.title,
            description: p.productId.description,
            amount: p.productId.price * 100,
            currency: "inr",
            quantity: p.quantity,
          };
        }),
        success_url:
          req.protocol + "://" + req.get("host") + "/checkout/success", // => http://localhost:3000
        cancel_url: req.protocol + "://" + req.get("host") + "/checkout/cancel",
      });
    })
    .then((session) => {
      res.render("shop/checkout", {
        path: "/checkout",
        pageTitle: "checkout page",
        products: products,
        totalSum: total,
        sessionId: session.id,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// get order page
exports.getOrder = (req, res) => {
  Order.find({ "user.userId": req.user._id })
    .then((order) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Order",
        orders: order,
        // isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// order the product functionality
exports.postOrder = (req, res) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items.map((i) => {
        // productId means all fields of product not just id
        return { quantity: i.quantity, product: { ...i.productId._doc } };
        // ._doc returns the full data inside the products
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user._id,
        },
        products: products,
      });
      return order.save();
    })
    .then(() => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      console.log(err);
    });
};
