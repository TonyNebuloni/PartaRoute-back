const fs = require("fs");
const path = require("path");
const swaggerJSDoc = require("swagger-jsdoc");

console.log("__dirname =", __dirname);

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
                url: "/api"
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
    apis: [path.join(__dirname, "routes/*.js")]
};

const swaggerSpec = swaggerJSDoc(options);

console.log("🔎 Swagger contient", Object.keys(swaggerSpec.paths || {}).length, "routes");

// 🔥 Écriture
const outputPath = path.resolve(__dirname, "public/swagger.json");
console.log("💡 Chemin de sortie :", outputPath);

const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

try {
    fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));
    console.log("✅ Écriture réussie !");
} catch (err) {
    console.error("❌ Erreur lors de l'écriture :", err);
}

fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));
console.log("✅ swagger.json généré à :", outputPath);
