import { Client } from 'pg';

async function setupTriggers() {
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
	});

	await client.connect();

	const sql = `
    CREATE OR REPLACE FUNCTION notify_change() RETURNS trigger AS $$
    BEGIN
      PERFORM pg_notify('occupancylog_channel', TG_TABLE_NAME || ' changed');
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS occupancylog_notify ON "OccupancyLog";

    CREATE TRIGGER occupancylog_notify
    AFTER INSERT OR UPDATE OR DELETE ON "OccupancyLog"
    FOR EACH ROW EXECUTE FUNCTION notify_change();
  `;

	await client.query(sql);

	console.log('Trigger criado com sucesso.');

	await client.end();
}

setupTriggers();

async function startListener() {
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
	});

	await client.connect();
	await client.query('LISTEN occupancylog_channel');

	client.on('notification', (msg: any) => {
		console.log('Banco alterado:', msg.payload);
	});
}

startListener();
