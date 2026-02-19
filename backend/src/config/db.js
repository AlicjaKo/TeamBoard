// config/db.js
import { config } from "dotenv";
import { Sequelize } from "sequelize";

config();

export const sequelize = new Sequelize(
	process.env.POSTGRES_DB,
	process.env.POSTGRES_USER,
	process.env.POSTGRES_PASSWORD,
	{
		host: process.env.POSTGRES_HOST || "db",
		dialect: "postgres",
		logging: false,
		retry: {
			match: [/ECONNREFUSED/, /SequelizeConnectionRefusedError/],
			max: 10,
		},
	},
);

export const connectDB = async () => {
	let attempts = 0;
	const maxAttempts = 10;
	const delay = 2000;

	while (attempts < maxAttempts) {
		try {
			await sequelize.authenticate();
			console.log("PostgreSQL connected");
			return;
		} catch (error) {
			attempts++;
			console.log(`DB connection failed (attempt ${attempts}/${maxAttempts})`);
			if (attempts >= maxAttempts) {
				console.error("Failed to connect to DB after retries:", error);
				throw error; // Let server start fail gracefully
			}
			await new Promise((r) => setTimeout(r, delay));
		}
	}
};
