// // config/db.js
// // MySQL connection pool — run schema.sql in MySQL before starting the server

// const mysql = require("mysql2");
// require("dotenv").config();

// // Create a connection pool (handles multiple requests at the same time)
// const pool = mysql.createPool({
//   host:             process.env.DB_HOST,
//   user:             process.env.DB_USER,
//   password:         process.env.DB_PASSWORD,
//   database:         process.env.DB_NAME,
//   waitForConnections: true,
//   connectionLimit:  10,
//   queueLimit:       0,
// });

// // Use promise version so we can write async/await in controllers
// const db = pool.promise();

// module.exports = { db };


// config/db.js

const mysql = require("mysql2");

const pool = mysql.createPool({
  host: "srv1826.hstgr.io",
  port: 3306,
  user: "u544101204_blsilks_admin",
  password: "YOUR_PASSWORD",
  database: "u544101204_bl_silks_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const db = pool.promise();

module.exports = { db };
