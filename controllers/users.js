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

// const db = makeDb({
//     user: "bac18c960a75b1",
//     host: "us-cdbr-east-03.cleardb.com",
//     password: "469ad2cf",
//     database: "heroku_b0684ff5a014fb7", //comment out to support creating programatically with route
//     multipleStatements: true
// });

const db = makeDb({
    user: "root",
    host: "localhost",
    password: "password",
    database: "kliqrassessment", //comment out to support creating programatically with route
    multipleStatements: true
});

//get all user data from db
async function getAllUsers(req, res) {
    const sql = 'SELECT * FROM users'
    try {
        const users = await db.query(sql);
        res.status(200).json({ users })
    } catch (error) {
        await db.close()
        console.log(error);
    }
}

//fetch user from db
async function userGetter(id) {
    const sql = 'SELECT * FROM users WHERE id = ?';
    const totalSql = 'SELECT COUNT(*) as total_transactions FROM users INNER JOIN transactions ON transactions.user_id = users.id WHERE user_id = ?' +
        'UNION ALL SELECT SUM(transactions.amount) as sum_of_cred FROM users INNER JOIN transactions ON transactions.user_id = users.id WHERE user_id = ? AND type = "credit" ' +
        'UNION ALL SELECT SUM(transactions.amount) as sum_of_deb FROM users INNER JOIN transactions ON transactions.user_id = users.id WHERE user_id = ? AND type = "debit"'
    try {
        const user = await db.query(sql, [id])

        const totalCreditDebit = await db.query(totalSql, [id, id, id])

        return { user, totalCreditDebit };
    } catch (error) {
        await db.close()
        console.log(error);
    }
}

//send user details to front end
async function getUser(req, res) {
    const { id } = req.params;
    try {
        const { user, totalCreditDebit } = await userGetter(id)
        res.status(200).json({ user, totalCreditDebit })
    } catch (error) {
        console.log(error);
    }

}


module.exports = { getAllUsers, getUser, userGetter }
