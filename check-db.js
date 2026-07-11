const { Client } = require('pg');
const client = new Client({ user: 'postgres', password: 'pritam', host: 'localhost', database: 'flowcart', port: 5432 });
client.connect().then(() => client.query("SELECT id, email, merchant_id FROM users;")).then(res => { console.log('Users:', res.rows); return client.query("SELECT id, phone_number FROM merchants;"); }).then(res => { console.log('Merchants:', res.rows); client.end(); }).catch(console.error);
