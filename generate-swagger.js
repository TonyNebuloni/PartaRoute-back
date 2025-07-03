const swaggerJSDoc = require("swagger-jsdoc");
const fs = require("fs");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "PartaRoute API",
            version: "1.0.0",
        },
        servers: [{ url: "https://ton-projet.vercel.app/api" }],
    },
    apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);
fs.writeFileSync("./public/swagger.json", JSON.stringify(swaggerSpec, null, 2));
console.log("✅ Swagger JSON généré dans /public/swagger.json");