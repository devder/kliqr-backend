const { json } = require('express');
const mysql = require('mysql');

const db = mysql.createConnection({
    user: "root",
    host: "localhost",
    password: "password",
    database: "kliqrassessment", //comment out to support creating programatically with route
    multipleStatements: true
})

//start connection
db.connect((err) => {
    if (err) return console.log('Connection failed', err);
    console.log('Connected to database');
})

async function getAllUsers(req, res) {
    const sql = 'SELECT * FROM users'
    try {
        db.query(sql, (err, users, fields) => {
            if (err) { console.log(err); throw err }
            res.status(200).json({ users })
        })
    } catch (error) {
        console.log(error);
    }
}



module.exports = { getAllUsers }