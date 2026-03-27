const { dbAll } = require('./db'); async function run() { console.log(await dbAll('SELECT * FROM customers')); } run();
