
const authorizeSelfOrAdmin = (req, res, next) => {
  const { id } = req.params;
  const { id_utilisateur, role } = req.user;

  if (role === "admin" || parseInt(id) === id_utilisateur) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Accès interdit. Vous ne pouvez accéder qu'à vos propres informations.",
  });
};

module.exports = authorizeSelfOrAdmin;

