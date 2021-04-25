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


async function getTransactions(req, res) {
    const sql = 'SELECT user_id FROM transactions'
    try {
        db.query(sql, (err, transactions, fields) => {
            if (err) { console.log(err); throw err }
            res.status(200).json({ transactions })
        })
    } catch (error) {
        res.status(5000).json({ message: 'Something went wrong' })
    }
}


module.exports = { getTransactions }