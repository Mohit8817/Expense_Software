const mysql = require("mysql2");

// Create connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",  
    database: "klkexp1504"
});

// Connect to DB
db.connect((err) => {
    if (err) {
        console.log("DB Connection Failed:", err);
    } else {
        console.log("MySQL Connected...");
    }
});

module.exports = db;