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

---

## 🧰 Stack technique

### Backend

- Node.js 
- Express.js
- Prisma (ORM)
- PostgreSQL
- JWT pour l'authentification
- Swagger pour la documentation de l’API

### Frontend

- Next 
- Tailwind CSS
- Axios pour les appels API
- PWA mobile-first

---

## 🗃️ Structure du projet

```
partaroute/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middlewares/
│   │   ├── types/
│   │   └── ...
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── ...
│   ├── .env
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   ├── router/
│   │   └── ...
│   └── package.json
└── README.md
```

---

## 🚀 Lancer le projet en local

### Prérequis

- Node.js (>= 18)
- PostgreSQL installé (ou Docker)
- npm ou yarn

### Backend

```bash
cd backend
npm install
npx prisma migrate dev
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 📌 Roadmap

- [X] Authentification complète avec JWT
- [X] Réservation de trajets
- [X] Dashboard administrateur
- [X] Système de messagerie ou notifications
- [X] Déploiement backend / frontend
- [ ] Carte interactive avec Leaflet ou Google Maps
- [ ] Paiement en ligne 
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


---

## ✨ À propos

Projet développé dans un objectif pédagogique. 
Partaroute vise à offrir une plateforme simple et efficace pour le covoiturage, à la fois pour les utilisateurs et les administrateurs.
