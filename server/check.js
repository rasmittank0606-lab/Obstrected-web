const { dbAll, dbGet } = require('./db');

async function main() {
    // Check what's in the appointments table
    console.log('=== APPOINTMENTS TABLE ===');
    const appts = await dbAll('SELECT id, client, arch, status FROM appointments');
    console.log(appts);

    // Check what's in the customers table  
    console.log('\n=== CUSTOMERS TABLE (name + username) ===');
    const custs = await dbGet("SELECT name, username FROM customers WHERE username LIKE '%rasmit%' OR LOWER(name) LIKE '%rasmit%'");
    console.log(custs);

    // Check all customers
    console.log('\n=== ALL CUSTOMERS ===');
    const allCusts = await dbAll('SELECT name, username FROM customers');
    console.log(allCusts);
}
main().catch(console.error);
