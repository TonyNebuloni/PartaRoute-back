const adminOnly = (req, res, next) => {
  const { role } = req.user;

  if (role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Accès réservé aux administrateurs.",
    });
  }

  next();
};

module.exports = adminOnly;
