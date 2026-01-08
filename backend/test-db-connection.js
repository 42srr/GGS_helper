const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Manually parse .env
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/\r$/, '');
  }
});

console.log('Parsed environment variables:');
console.log('Host:', env.DATABASE_HOST);
console.log('Port:', env.DATABASE_PORT);
console.log('User:', env.DATABASE_USER);
console.log('Password:', env.DATABASE_PASSWORD);
console.log('Database:', env.DATABASE_NAME);

const client = new Client({
  host: env.DATABASE_HOST,
  port: parseInt(env.DATABASE_PORT),
  user: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  database: env.DATABASE_NAME,
  ssl: false,
});

console.log('\nAttempting to connect...');

client.connect()
  .then(() => {
    console.log('\n✅ Successfully connected to PostgreSQL!');
    return client.query('SELECT version()');
  })
  .then((res) => {
    console.log('PostgreSQL version:', res.rows[0].version);
    return client.end();
  })
  .then(() => {
    console.log('Connection closed.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Connection failed:');
    console.error('Error:', err.message);
    console.error('Code:', err.code);
    process.exit(1);
  });
