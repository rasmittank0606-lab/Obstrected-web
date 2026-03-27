const { dbAll } = require('./db'); async function run() { console.log(await dbAll('SELECT * FROM customers WHERE LOWER(name) = ?', ['rasmit tank'])); } run();
