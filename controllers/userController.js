const prisma = require('../prisma/prisma');

const bcrypt = require("bcryptjs");

// ────────────────────────────────
// UTILISATEUR CONNECTÉ
// ────────────────────────────────

exports.getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.utilisateur.findUnique({
      where: { id_utilisateur: parseInt(id) },
      select: {
        id_utilisateur: true,
        nom: true,
        email: true,
        role: true,
        photo_profil: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé." });
    }

    res.status(200).json({
      success: true,
      data: {
        ...user,
        links: generateUserLinks(user)
      }
    });
  } catch (err) {
    console.error("Erreur getUserById:", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

exports.editUser = async (req, res) => {
  const { nom, email, mot_de_passe } = req.body;
  const { id_utilisateur } = req.user;

  try {
    const emailExists = await prisma.utilisateur.findFirst({
      where: {
        email,
        NOT: { id_utilisateur },
      },
    });
    if (emailExists) {
      return res.status(409).json({ success: false, message: "Cet email est déjà utilisé." });
    }

    const updateData = { nom, email };

    if (mot_de_passe) {
      const hashed = await bcrypt.hash(mot_de_passe, 10);
      updateData.mot_de_passe = hashed;
    }

    const updatedUser = await prisma.utilisateur.update({
      where: { id_utilisateur },
      data: updateData,
      select: { id_utilisateur: true, nom: true, email: true, role: true },
    });

    res.status(200).json({
      success: true,
      data: {
        ...updatedUser,
        links: generateUserLinks(updatedUser)
      }
    });
  } catch (err) {
    console.error("Erreur editUser:", err);
    res.status(500).json({ success: false, message: "Erreur lors de la mise à jour." });
  }
};

exports.deleteUser = async (req, res) => {
  const { id_utilisateur } = req.user;

  try {
    await prisma.utilisateur.delete({
      where: { id_utilisateur },
    });

    res.status(200).json({
      success: true,
      message: "Utilisateur supprimé avec succès.",
      links: {
        create: {
          href: `/api/auth/register`,
          method: "POST"
        },
        list: {
          href: `/api/users`,
          method: "GET"
        }
      }
    });
  } catch (err) {
    console.error("Erreur deleteUser:", err);
    res.status(500).json({ success: false, message: "Erreur lors de la suppression." });
  }
};

// ────────────────────────────────
// ADMINISTRATEUR
// ────────────────────────────────

exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.utilisateur.findMany({
      select: {
        id_utilisateur: true,
        nom: true,
        email: true,
        role: true,
        photo_profil: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: users.map(user => ({
        ...user,
        _links: generateUserLinks(user)
      }))
    });
  } catch (err) {
    console.error("Erreur getAllUsers:", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

exports.editUserByAdmin = async (req, res) => {
  const { id } = req.params;
  const { nom, email, mot_de_passe, role } = req.body;

  try {
    const emailExists = await prisma.utilisateur.findFirst({
      where: {
        email,
        NOT: { id_utilisateur: parseInt(id) }
      }
    });
    if (emailExists) {
      return res.status(409).json({ success: false, message: "Cet email est déjà utilisé." });
    }

    const updateData = { nom, email, role };

    if (mot_de_passe) {
      const hashed = await bcrypt.hash(mot_de_passe, 10);
      updateData.mot_de_passe = hashed;
    }

    const updatedUser = await prisma.utilisateur.update({
      where: { id_utilisateur: parseInt(id) },
      data: updateData,
      select: {
        id_utilisateur: true,
        nom: true,
        email: true,
        role: true
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        ...updatedUser,
        links: generateUserLinks(updatedUser)
      }
    });
  } catch (err) {
    console.error("Erreur editUserByAdmin:", err);
    res.status(500).json({ success: false, message: "Erreur lors de la mise à jour." });
  }
};

exports.deleteUserByAdmin = async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id_utilisateur;

  try {
    if (parseInt(id) === 2) {
      return res.status(403).json({ success: false, message: "Impossible de supprimer le super administrateur." });
    }

    if (parseInt(id) === adminId) {
      return res.status(403).json({ success: false, message: "Vous ne pouvez pas vous supprimer vous-même." });
    }

    await prisma.utilisateur.delete({
      where: { id_utilisateur: parseInt(id) },
    });

    res.status(200).json({
      success: true,
      message: "Utilisateur supprimé avec succès.",
      links: {
        create: {
          href: `/api/auth/register`,
          method: "POST"
        },
        list: {
          href: `/api/users`,
          method: "GET"
        }
      }
    });
  } catch (err) {
    console.error("Erreur deleteUserByAdmin:", err);
    res.status(500).json({ success: false, message: "Erreur lors de la suppression." });
  }
};

function generateUserLinks(user) {
  return {
    self: {
      href: `/api/users/${user.id_utilisateur}`,
      method: "GET"
    },
    update: {
      href: `/api/users/${user.id_utilisateur}`,
      method: "PATCH"
    },
    delete: {
      href: `/api/users/${user.id_utilisateur}`,
      method: "DELETE"
    }
  };
}