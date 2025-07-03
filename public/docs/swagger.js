const path = require("path");
const express = require("express");
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Configuration Swagger
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "PartaRoute API",
      version: "1.0.0",
      description: "Documentation de l'API de PartaRoute, une application de covoiturage.",
    },
    servers: [
      {
        url: process.env.API_BASE_URL || "http://localhost:3000/api",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"], // Assure-toi que le chemin est correct selon ton projet
};

// Génération du swaggerSpec
const swaggerSpec = swaggerJSDoc(options);

// Chemin vers les fichiers statiques de Swagger UI
const swaggerUiDistPath = path.join(
    __dirname,
    "../node_modules/swagger-ui-dist"
);

// Fonction d’intégration dans Express
const setupSwagger = (app) => {
  // Sert les fichiers JS/CSS nécessaires à Swagger UI (obligatoire sur Vercel)
  app.use("/api-docs", express.static(swaggerUiDistPath, { index: false }));

  // Initialise Swagger UI
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = setupSwagger;
