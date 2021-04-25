const util = require('util');
const mysql = require('mysql');

//make database query a promise
function makeDb(config) {
    const connection = mysql.createConnection(config);
    return {
        query(sql, args) {
            return util.promisify(connection.query)
                .call(connection, sql, args);
        },
        close() {
            return util.promisify(connection.end).call(connection);
        }
    };
}

const db = makeDb({
    user: "root",
    host: "localhost",
    password: "password",
    database: "kliqrassessment", //comment out to support creating programatically with route
    multipleStatements: true
});

//get all transactions from db
async function getTransactions(req, res) {
    const sql = 'SELECT user_id FROM transactions'
    try {
        const transactions = await db.query(sql)
        res.status(200).json({ transactions })
    } catch (error) {
        res.status(5000).json({ message: 'Something went wrong' })
    }
}


module.exports = { getTransactions }