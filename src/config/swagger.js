import swaggerJSDoc from 'swagger-jsdoc';
import path from "path";

const options = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'Finance Tracker API',
			version: '1.0.0',
		},
		components: {
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
				},
			},
		},
		security: [
			{
				bearerAuth: [],
			},
		],
	},
apis: [path.join(process.cwd(), "src/routes/**/*.js")]};

export default swaggerJSDoc(options);
