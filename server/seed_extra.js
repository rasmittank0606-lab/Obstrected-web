const { dbRun } = require('./db');

(async () => {
    try {
        await dbRun("INSERT INTO appointments (client, type, date, time, status, arch, email, phone) VALUES ('Rohan Mehta', 'Villa', '2026-04-10', '10:00 AM', 'pending', 'beloo.gajjar', 'rohan@test.com', '1234567890')");
        await dbRun("INSERT INTO appointments (client, type, date, time, status, arch, email, phone) VALUES ('Rohan Mehta', 'Villa', '2026-04-20', '11:00 AM', 'confirmed', 'beloo.gajjar', 'rohan@test.com', '1234567890')");
        
        await dbRun("INSERT INTO messages (client, msg, date, status, arch) VALUES ('Rohan Mehta', 'When does foundation start?', '2026-03-22', 'unread', 'beloo.gajjar')");
        
        console.log("Db Seeded with extra records.");
    } catch (e) {
        console.error(e);
    }
})();
