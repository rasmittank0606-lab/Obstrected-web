const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

const architects = [
    { username: 'beloo.gajjar',      password: 'Arch@BeG2024', name: 'Ar. Beloo Gajjar',       speciality: 'Modern Residential & Villa Designs',       projects: 28, appointments: 5 },
    { username: 'riya.kavathiya',     password: 'Arch@RiK2024', name: 'Ar. Riya Kavathiya',      speciality: 'Interior Layouts & Contemporary Planning',  projects: 22, appointments: 3 },
    { username: 'kushal.shah',        password: 'Arch@KuS2024', name: 'Ar. Kushal Shah',         speciality: 'Luxury Villas & Innovative Concepts',       projects: 19, appointments: 4 },
    { username: 'diya.patel',         password: 'Arch@DiP2024', name: 'Ar. Diya Patel',          speciality: 'Luxury Villas & Modern Architecture',       projects: 17, appointments: 2 },
    { username: 'yesh.muleva',        password: 'Arch@YeM2024', name: 'Ar. Yesh Muleva',         speciality: 'Urban Architecture & Smart Design',         projects: 21, appointments: 6 },
    { username: 'himani.shukla',      password: 'Arch@HiS2024', name: 'Ar. Himani Shukla',       speciality: 'Sustainable & Green Architecture',          projects: 15, appointments: 3 },
    { username: 'amritansh.pandey',   password: 'Arch@AmP2024', name: 'Ar. Amritansh Pandey',    speciality: 'Commercial & Residential Architecture',     projects: 24, appointments: 7 },
    { username: 'rajveer.vaghela',    password: 'Arch@RaV2024', name: 'Ar. Rajveer Vaghela',     speciality: 'Expert in interior layouts and contemporary house planning', projects: 12, appointments: 0 }
];

const customers = [
    { username:'rohan.mehta',    password:'Cust@RoM2024', name:'Rohan Mehta',      houseType:'Villa',     architect:'Ar. Beloo Gajjar',     budget:'₹85 Lakh',   city:'Ahmedabad' },
    { username:'sneha.doshi',    password:'Cust@SnD2024', name:'Sneha Doshi',       houseType:'Apartment', architect:'Ar. Beloo Gajjar',     budget:'₹45 Lakh',   city:'Surat'     },
    { username:'karan.patel',    password:'Cust@KaP2024', name:'Karan Patel',       houseType:'Bunglow',   architect:'Ar. Beloo Gajjar',     budget:'₹62 Lakh',   city:'Vadodara'  },
    { username:'priya.shah',     password:'Cust@PrS2024', name:'Priya Shah',        houseType:'Penthouse', architect:'Ar. Beloo Gajjar',     budget:'₹1.2 Crore', city:'Mumbai'    },
    { username:'vikram.nair',    password:'Cust@ViN2024', name:'Vikram Nair',       houseType:'Villa',     architect:'Ar. Kushal Shah',      budget:'₹95 Lakh',   city:'Pune'      },
    { username:'divya.tiwari',   password:'Cust@DiT2024', name:'Divya Tiwari',      houseType:'Penthouse', architect:'Ar. Amritansh Pandey', budget:'₹1.5 Crore', city:'Delhi'     },
    { username:'harish.pandya',  password:'Cust@HaP2024', name:'Harish Pandya',     houseType:'Villa',     architect:'Ar. Yesh Muleva',      budget:'₹78 Lakh',   city:'Rajkot'    },
    { username:'amit.jain',      password:'Cust@AmJ2024', name:'Amit Jain',         houseType:'Duplex',    architect:'Ar. Beloo Gajjar',     budget:'₹55 Lakh',   city:'Indore'    },
    { username:'nisha.trivedi',  password:'Cust@NiT2024', name:'Nisha Trivedi',     houseType:'Duplex',    architect:'Ar. Riya Kavathiya',   budget:'₹50 Lakh',   city:'Surat'     },
    { username:'pooja.iyer',     password:'Cust@PoI2024', name:'Pooja Iyer',        houseType:'Penthouse', architect:'Ar. Kushal Shah',      budget:'₹1.1 Crore', city:'Chennai'   },
];

const allAppointments = [
    { client:'Rohan Mehta',     type:'Villa',     date:'2026-03-25', time:'10:00 AM', status:'confirmed',  arch:'beloo.gajjar' },
    { client:'Sneha Doshi',     type:'Apartment', date:'2026-03-27', time:'02:00 PM', status:'pending',    arch:'beloo.gajjar' },
    { client:'Karan Patel',     type:'Bunglow',   date:'2026-03-28', time:'11:30 AM', status:'confirmed',  arch:'beloo.gajjar' },
    { client:'Priya Shah',      type:'Penthouse', date:'2026-04-01', time:'09:00 AM', status:'pending',    arch:'beloo.gajjar' },
    { client:'Amit Jain',       type:'Duplex',    date:'2026-03-23', time:'03:00 PM', status:'confirmed',  arch:'beloo.gajjar' },
    { client:'Nisha Trivedi',   type:'Duplex',    date:'2026-03-24', time:'11:00 AM', status:'confirmed',  arch:'riya.kavathiya' },
    { client:'Raj Soni',        type:'Apartment', date:'2026-03-29', time:'02:30 PM', status:'pending',    arch:'riya.kavathiya' },
    { client:'Deepa Verma',     type:'Villa',     date:'2026-04-02', time:'10:00 AM', status:'confirmed',  arch:'riya.kavathiya' },
    { client:'Vikram Nair',     type:'Villa',     date:'2026-03-26', time:'09:30 AM', status:'confirmed',  arch:'kushal.shah' },
    { client:'Pooja Iyer',      type:'Penthouse', date:'2026-03-30', time:'12:00 PM', status:'pending',    arch:'kushal.shah' },
    { client:'Sanjay Kumar',    type:'Bunglow',   date:'2026-04-05', time:'02:00 PM', status:'confirmed',  arch:'kushal.shah' },
    { client:'Tina Reddy',      type:'Apartment', date:'2026-04-08', time:'10:30 AM', status:'pending',    arch:'kushal.shah' },
    { client:'Manan Shah',      type:'Bunglow',   date:'2026-03-22', time:'03:30 PM', status:'confirmed',  arch:'diya.patel' },
    { client:'Aarti Desai',     type:'Villa',     date:'2026-03-31', time:'11:00 AM', status:'pending',    arch:'diya.patel' },
    { client:'Harish Pandya',   type:'Villa',     date:'2026-03-23', time:'10:00 AM', status:'confirmed',  arch:'yesh.muleva' },
    { client:'Meena Chaudhary', type:'Apartment', date:'2026-03-25', time:'01:00 PM', status:'confirmed',  arch:'yesh.muleva' },
    { client:'Nilesh Bhatt',    type:'Duplex',    date:'2026-03-28', time:'04:00 PM', status:'pending',    arch:'yesh.muleva' },
    { client:'Kavya Joshi',     type:'Penthouse', date:'2026-04-03', time:'10:00 AM', status:'confirmed',  arch:'yesh.muleva' },
    { client:'Ruchit Gandhi',   type:'Bunglow',   date:'2026-04-07', time:'02:30 PM', status:'confirmed',  arch:'yesh.muleva' },
    { client:'Foram Modi',      type:'Villa',     date:'2026-04-10', time:'09:00 AM', status:'pending',    arch:'yesh.muleva' },
    { client:'Sunil Das',       type:'Apartment', date:'2026-03-24', time:'12:30 PM', status:'confirmed',  arch:'himani.shukla' },
    { client:'Anjali Roy',      type:'Duplex',    date:'2026-03-27', time:'03:00 PM', status:'pending',    arch:'himani.shukla' },
    { client:'Prateek Malhotra',type:'Bunglow',   date:'2026-04-04', time:'11:00 AM', status:'confirmed',  arch:'himani.shukla' },
    { client:'Divya Tiwari',    type:'Penthouse', date:'2026-03-22', time:'10:30 AM', status:'confirmed',  arch:'amritansh.pandey' },
    { client:'Shyam Agarwal',   type:'Villa',     date:'2026-03-24', time:'02:00 PM', status:'confirmed',  arch:'amritansh.pandey' },
    { client:'Rekha Gupta',     type:'Apartment', date:'2026-03-26', time:'11:30 AM', status:'pending',    arch:'amritansh.pandey' },
    { client:'Arjun Choudhary', type:'Duplex',    date:'2026-03-29', time:'01:00 PM', status:'confirmed',  arch:'amritansh.pandey' },
    { client:'Bhavna Parikh',   type:'Bunglow',   date:'2026-04-02', time:'09:30 AM', status:'confirmed',  arch:'amritansh.pandey' },
    { client:'Chirag Lakhani',  type:'Penthouse', date:'2026-04-06', time:'03:30 PM', status:'pending',    arch:'amritansh.pandey' },
    { client:'Dhwani Vyas',     type:'Villa',     date:'2026-04-09', time:'02:00 PM', status:'confirmed',  arch:'amritansh.pandey' },
];

const allProjects = [
    { name:'Skyline Residences',  type:'Apartment', client:'Rohan Mehta',      progress:75,  arch:'beloo.gajjar', start: '2025-09-01', end: '2026-06-30' },
    { name:'Green Valley Villa',  type:'Villa',     client:'Sneha Doshi',      progress:40,  arch:'beloo.gajjar', start: '2025-11-15', end: '2026-09-15' },
    { name:'Sunrise Bunglow',     type:'Bunglow',   client:'Karan Patel',      progress:90,  arch:'beloo.gajjar', start: '2025-07-01', end: '2026-04-15' },
    { name:'Coastal View Duplex', type:'Duplex',    client:'Nisha Trivedi',    progress:55,  arch:'riya.kavathiya', start: '2025-09-15', end: '2026-07-01' },
    { name:'Metro Heights',       type:'Apartment', client:'Raj Soni',         progress:30,  arch:'riya.kavathiya', start: '2026-01-01', end: '2026-12-31' },
    { name:'Serenity Villa',      type:'Villa',     client:'Vikram Nair',      progress:60,  arch:'kushal.shah', start: '2025-10-01', end: '2026-08-01' },
    { name:'Sky Penthouse',       type:'Penthouse', client:'Pooja Iyer',       progress:20,  arch:'kushal.shah', start: '2026-02-01', end: '2027-01-31' },
    { name:'Heritage Bunglow',    type:'Bunglow',   client:'Sanjay Kumar',     progress:85,  arch:'kushal.shah', start: '2025-08-01', end: '2026-05-01' },
    { name:'Twin Towers Duplex',  type:'Duplex',    client:'Manan Shah',       progress:45,  arch:'diya.patel', start: '2025-11-01', end: '2026-10-01' },
    { name:'Royal Villa',         type:'Villa',     client:'Aarti Desai',      progress:70,  arch:'diya.patel', start: '2025-09-01', end: '2026-07-01' },
    { name:'Summit View',         type:'Villa',     client:'Harish Pandya',    progress:50,  arch:'yesh.muleva', start: '2025-12-01', end: '2026-10-01' },
    { name:'Urban Nest',          type:'Apartment', client:'Meena Chaudhary',  progress:35,  arch:'yesh.muleva', start: '2026-01-15', end: '2026-11-15' },
    { name:'Lakeside Bunglow',    type:'Bunglow',   client:'Ruchit Gandhi',    progress:65,  arch:'yesh.muleva', start: '2025-10-15', end: '2026-08-15' },
    { name:'Eco Green Flat',      type:'Apartment', client:'Sunil Das',        progress:80,  arch:'himani.shukla', start: '2025-07-15', end: '2026-03-15' },
    { name:'Garden Duplex',       type:'Duplex',    client:'Prateek Malhotra', progress:25,  arch:'himani.shukla', start: '2026-02-15', end: '2027-02-15' },
    { name:'Elite Penthouse',     type:'Penthouse', client:'Divya Tiwari',     progress:90,  arch:'amritansh.pandey', start: '2025-08-01', end: '2026-03-30' },
    { name:'Majestic Villa',      type:'Villa',     client:'Shyam Agarwal',    progress:60,  arch:'amritansh.pandey', start: '2025-10-01', end: '2026-09-01' },
    { name:'Prestige Residency',  type:'Apartment', client:'Rekha Gupta',      progress:40,  arch:'amritansh.pandey', start: '2025-12-01', end: '2026-11-01' },
    { name:'Classic Duplex',      type:'Duplex',    client:'Arjun Choudhary',  progress:55,  arch:'amritansh.pandey', start: '2025-11-01', end: '2026-08-01' },
];


const allMessages = [
    { client:'Rohan Mehta',      msg:'Can we adjust the living room layout?',          date:'2026-03-20', status:'unread', arch:'beloo.gajjar'    },
    { client:'Sneha Doshi',      msg:'Please share the revised floor plan.',            date:'2026-03-19', status:'read',   arch:'beloo.gajjar'    },
    { client:'Nisha Trivedi',    msg:'What materials are you recommending for walls?',  date:'2026-03-18', status:'unread', arch:'riya.kavathiya'  },
    { client:'Vikram Nair',      msg:'Can we schedule a site visit on Saturday?',       date:'2026-03-20', status:'read',   arch:'kushal.shah'     },
    { client:'Manan Shah',       msg:'Send me the updated 3D model please.',            date:'2026-03-17', status:'unread', arch:'diya.patel'      },
    { client:'Harish Pandya',    msg:'Can we change the kitchen to open plan?',         date:'2026-03-21', status:'unread', arch:'yesh.muleva'     },
    { client:'Divya Tiwari',     msg:'Looking forward to the terrace design!',          date:'2026-03-19', status:'read',   arch:'amritansh.pandey'},
    { client:'Sunil Das',        msg:'Can solar panels be added on the roof?',          date:'2026-03-20', status:'unread', arch:'himani.shukla'   },
];

db.serialize(() => {
    // Drop existing tables
    db.run("DROP TABLE IF EXISTS architects");
    db.run("DROP TABLE IF EXISTS customers");
    db.run("DROP TABLE IF EXISTS appointments");
    db.run("DROP TABLE IF EXISTS projects");
    db.run("DROP TABLE IF EXISTS messages");

    // Create tables
    db.run(`CREATE TABLE architects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        name TEXT,
        speciality TEXT,
        projects INTEGER,
        appointments INTEGER
    )`);

    db.run(`CREATE TABLE customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        name TEXT,
        houseType TEXT,
        architect TEXT,
        budget TEXT,
        city TEXT
    )`);

    db.run(`CREATE TABLE appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client TEXT,
        type TEXT,
        date TEXT,
        time TEXT,
        status TEXT,
        arch TEXT,
        email TEXT,
        phone TEXT,
        planning TEXT
    )`);

    db.run(`CREATE TABLE projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        type TEXT,
        client TEXT,
        progress INTEGER,
        arch TEXT,
        start TEXT,
        end TEXT
    )`);

    db.run(`CREATE TABLE messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client TEXT,
        msg TEXT,
        date TEXT,
        status TEXT,
        arch TEXT
    )`);

    // Prepare statements
    const stmtArch = db.prepare("INSERT INTO architects (username, password, name, speciality, projects, appointments) VALUES (?, ?, ?, ?, ?, ?)");
    architects.forEach(a => stmtArch.run(a.username, a.password, a.name, a.speciality, a.projects, a.appointments));
    stmtArch.finalize();

    const stmtCust = db.prepare("INSERT INTO customers (username, password, name, houseType, architect, budget, city) VALUES (?, ?, ?, ?, ?, ?, ?)");
    customers.forEach(c => stmtCust.run(c.username, c.password, c.name, c.houseType, c.architect, c.budget, c.city));
    stmtCust.finalize();

    const stmtAppt = db.prepare("INSERT INTO appointments (client, type, date, time, status, arch) VALUES (?, ?, ?, ?, ?, ?)");
    allAppointments.forEach(a => stmtAppt.run(a.client, a.type, a.date, a.time, a.status, a.arch));
    stmtAppt.finalize();

    const stmtProj = db.prepare("INSERT INTO projects (name, type, client, progress, arch, start, end) VALUES (?, ?, ?, ?, ?, ?, ?)");
    allProjects.forEach(p => stmtProj.run(p.name, p.type, p.client, p.progress, p.arch, p.start, p.end));
    stmtProj.finalize();

    const stmtMsg = db.prepare("INSERT INTO messages (client, msg, date, status, arch) VALUES (?, ?, ?, ?, ?)");
    allMessages.forEach(m => stmtMsg.run(m.client, m.msg, m.date, m.status, m.arch));
    stmtMsg.finalize();

    console.log("Database initialized successfully.");
});

db.close();
