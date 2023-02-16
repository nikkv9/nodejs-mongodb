exports.getPageNotFound = (req, res) => {
  res.render("pageNotFound", {
    pageTitle: "Page Not Found",
    isAuthenticated: req.isLoggedIn,
  });
};
