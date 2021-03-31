// Swagger UI config js file. Unused currently
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const express = require("express");
const router = express.Router();

// Swagger set up
const options = {
    swaggerDefinition: {
        openapi: "3.0.0",
        info: {
            title: "Top View",
            version: "1.0.0",
        },
        servers: [
            {
                url: "http://localhost:8080/api/v1"
            }
        ]
    },
    apis: []
};
const specs = swaggerJsdoc(options);
router.use("/docs", swaggerUi.serve);
const swaggerDoc = router.get(
    "/docs",
    swaggerUi.setup(specs, {
        explorer: true
    })
);

module.exports = swaggerDoc;