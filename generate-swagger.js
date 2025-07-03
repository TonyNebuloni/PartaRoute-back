const fs = require("fs");
const path = require("path");
const swaggerJSDoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "PartaRoute API",
            version: "1.0.0",
            description: "Documentation générée automatiquement",
        },
        servers: [
            {
                url: "http://localhost:3000/api"
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: [path.join(__dirname, "routes/*.js")] // Important
};

const swaggerSpec = swaggerJSDoc(options);

// Sauvegarde dans /public
fs.writeFileSync(path.join(__dirname, "public/swagger.json"), JSON.stringify(swaggerSpec, null, 2));
console.log("✅ swagger.json généré automatiquement dans /public");
