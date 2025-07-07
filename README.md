# 🚗 Partaroute - Plateforme de covoiturage moderne

**Partaroute** est une application complète de covoiturage, pensée pour faciliter la mise en relation entre conducteurs et passagers de manière sécurisée, intuitive et efficace.

---

## 📦 Fonctionnalités principales

- 🔐 Authentification avec rôles (`user`, `admin`) via JWT
- 🧑‍💼 Gestion des utilisateurs : création de profil, connexion, déconnexion
- 📍 Création et réservation de trajets
- 🔎 Système de recherche de trajets avec filtres
- 🧪 Tests unitaires et end-to-end
- 📑 Documentation API via Swagger
- ☁️ Déploiement sur cloud (Render, Vercel, etc.)
- 📊 Dashboard admin : modération
- 🖼️ Upload de photo de profil utilisateur (compatible Vercel, stockage temporaire)

---

## 🧰 Stack technique (Backend)

- Node.js 
- Express.js
- Prisma (ORM)
- PostgreSQL
- JWT pour l'authentification
- Swagger pour la documentation de l'API
- Multer pour l'upload de fichiers (utilisation de `/tmp` sur Vercel)

---

## 🗃️ Structure du projet (Backend)

```
partaroute-back/
├── api/
├── controllers/
├── middlewares/
├── prisma/
├── public/
├── routes/
├── services/
├── tests/
├── uploads/
├── index.js
├── package.json
└── README.md
```

---

## 🚀 Lancer le backend en local

### Prérequis

- Node.js (>= 18)
- PostgreSQL installé (ou Docker)
- npm ou yarn

### Backend

```bash
npm install
npx prisma migrate dev
npm run dev
```

---

## 📁 Gestion des fichiers uploadés (photos de profil)

- En local, les fichiers sont stockés dans `uploads/profile_photos/`.
- Sur Vercel, les fichiers sont stockés dans le dossier temporaire `/tmp/profile_photos/` (limitation imposée par Vercel : les fichiers sont supprimés à chaque redéploiement ou redémarrage de la fonction serverless).
- **Pour une persistance réelle, il est recommandé d'utiliser un service cloud (ex : AWS S3, Cloudinary, etc.).**

---

## 📌 Roadmap

- [X] Authentification complète avec JWT
- [X] Réservation de trajets
- [X] Dashboard administrateur
- [X] Système de notifications
- [X] Déploiement backend
- [X] Upload de photo de profil compatible cloud
- [ ] Carte interactive avec Leaflet ou Google Maps
- [ ] Paiement en ligne 
- [ ] Stockage cloud permanent pour les fichiers uploadés
- [ ] Gestion avancée des notifications (temps réel, emails, etc.)
---

## 🤝 Contribution

Les contributions sont les bienvenues !

```bash
# Étapes recommandées
1. Fork le projet
2. Crée une branche (`git checkout -b feature/NouvelleFonction`)
3. Commit tes changements (`git commit -m 'Ajoute ma fonctionnalité'`)
4. Push ta branche (`git push origin feature/NouvelleFonction`)
5. Crée une Pull Request
```

---

## ✨ À propos

Projet développé dans un objectif pédagogique. 
Partaroute vise à offrir une plateforme simple et efficace pour le covoiturage, à la fois pour les utilisateurs et les administrateurs.
