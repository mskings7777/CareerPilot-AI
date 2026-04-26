import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CareerPilot API',
      version: '1.0.0',
      description: 'AI-driven career guidance platform API',
      contact: {
        name: 'CareerPilot Team',
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || '/',
        description: 'Current deployment',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [path.resolve(__dirname, '../routes/*.ts')],
};

export const swaggerSpec = swaggerJsdoc(options);
