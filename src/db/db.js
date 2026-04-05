import pg from 'pg';
const { Client } = pg;

const createDatabaseClient = async () => {
	const connectionString = process.env['DATABASE_URL'];
	const client = new Client({
		connectionString,
	});
	await client.connect().catch((err) => {
		console.error(`failed to connect to database: ${err}`);
	});
	console.log('Database client connection successful')
	return client;
};
export default createDatabaseClient;
