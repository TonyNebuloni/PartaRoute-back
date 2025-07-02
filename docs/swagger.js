const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

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
    /**
     * @swagger
     * /trips/{id}:
     *   get:
     *     summary: Récupérer un trajet précis par son ID
     *     tags: [Trajets]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID du trajet
     *     responses:
     *       200:
     *         description: Trajet trouvé
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   type: object
     *       404:
     *         description: Trajet non trouvé
     */
  },
  apis: ["./routes/*.js"], // Assure-toi que les routes sont bien à la racine de "routes"
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = setupSwagger;
