const { promisify } = require('util');
const mysql = require('mysql');
const { userGetter } = require('./users')

//make database query a promise
function makeDb(config) {
    const connection = mysql.createConnection(config);
    return {
        query(sql, args) {
            return promisify(connection.query)
                .call(connection, sql, args);
        },
        close() {
            return promisify(connection.end).call(connection);
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

//get details from past year
function getPastYear(array) {
    return array.filter(item => {

        const itemDate = new Date(item.date_time.substr(0, 10))
        const currentDate = new Date()

        const dateDiff = currentDate.getTime() - itemDate.getTime()

        const difference_In_Days = dateDiff / (1000 * 3600 * 24);

        if (Math.round(difference_In_Days) < 366) {
            return item
        }
    })
}
//get all transactions from db
async function getTransactions(req, res) {
    const sql = 'SELECT user_id FROM transactions'
    try {
        const transactions = await db.query(sql)
        res.status(200).json({ transactions })
    } catch (error) {
        await db.close()
        res.status(500).json({ message: 'Something went wrong' })
    }
}

//get users recurring expenses wrt a specific number of months
async function getUserRecurringExpenses(id, numOfMonths) {

    let today = new Date();
    let currentMonth = today.getMonth() + 1
    let oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
    //expenses grouped by month
    let groupedExpenses = [[], [], [], [], [], [], [], [], [], [], [], []]
    // let expenses = { jan: [], feb: [], mar: [], apr: [], may: [], jun: [], jul: [], aug: [], september: [], oct: [], nov: [], dec: [] }
    let allUsersCategoriesObject = {};
    let recurringExpenses = []
    try {

        const sql = `SELECT *,MONTH(date_time) AS transactionMonth FROM transactions WHERE user_id = ? AND TYPE = 'debit' ` +
            ` ORDER BY date_time`

        const sql2 = `SELECT category,date_time FROM transactions WHERE user_id = ? AND TYPE = "debit" ORDER BY category`


        //all user expenses from database
        const userExpenses = await db.query(sql, [id])

        //the categories user spent on
        const userCategories = await db.query(sql2, [id])

        let transactionsWithinPastYear = getPastYear(userExpenses)
        let allUsersCategories = [...new Set(getPastYear(userCategories).map(categoryWithinPastYear => categoryWithinPastYear.category))]

        //group expenses
        transactionsWithinPastYear.map(transaction => {
            for (let i = 0; i < 12; i++) {
                if (transaction.transactionMonth === i + 1) {
                    groupedExpenses[i].push(transaction.category)
                }
            }
        })

        //list showing how many times a user spent on each transaction per month
        const numOfTimesPerMonth = groupedExpenses.map(groupExp => {
            if (groupExp.length < 1) return;

            const categoryMap = {}
            groupExp.forEach(exp => {
                if (categoryMap[exp]) {
                    categoryMap[exp]++
                } else {
                    categoryMap[exp] = 1
                }
            })
            return categoryMap;
        })

        //create an object with the categories a user spent on
        for (let i = 0; i < allUsersCategories.length; i++) {
            allUsersCategoriesObject[allUsersCategories[i]] = 0
        }

        for (let c = 0; c < numOfTimesPerMonth.length; c++) {
            if (numOfTimesPerMonth[c] === null) return;

            for (let monthCategoryInObj in numOfTimesPerMonth[c]) {
                allUsersCategoriesObject[monthCategoryInObj] += numOfTimesPerMonth[c][monthCategoryInObj]
                if (allUsersCategoriesObject[monthCategoryInObj]) {
                }
            }
        }

        for (let categoryItem in allUsersCategoriesObject) {
            if (allUsersCategoriesObject[categoryItem] >= numOfMonths) {
                recurringExpenses.push(categoryItem)
            }
        }

        return recurringExpenses;
    } catch (error) {
        await db.close()
        console.log(error);
    }
}

async function getExpenseTrend(req, res) {
    const { id } = req.params
    try {
        const sql = 'SELECT category,icon_url FROM transactions GROUP BY category,icon_url ORDER BY category'
        const sql2 = 'SELECT id FROM users'
        const otherUsersExpenseTrends = {};
        const categoryWithIcons = await db.query(sql)

        //passing '1' to the function lists all the categories a user has spent on
        const recurringExpenses = await getUserRecurringExpenses(id, 7)

        const expenseTrendIcons = categoryWithIcons.filter(category => recurringExpenses.includes(category.category))

        const usersId = await db.query(sql2)


        //get other users expense trend
        for (let userId of usersId) {
            otherUsersExpenseTrends[userId.id] = await getUserRecurringExpenses(userId.id, 5)
        }

        const similarUsers = []
        for (let user in otherUsersExpenseTrends) {
            if (otherUsersExpenseTrends[user].some(ex => recurringExpenses.includes(ex))) {
                similarUsers.push(user)
            }
        }

        const similarUsersDetails = []

        for (let usr of similarUsers) {
            const { user, totalCreditDebit } = await userGetter(usr)
            similarUsersDetails.push({ user, totalCreditDebit })
        }

        res.status(200).json({ expenseTrendIcons, similarUsersDetails })
    } catch (error) {
        await db.close()
        console.log(error);
    }
}

module.exports = { getTransactions, getExpenseTrend }