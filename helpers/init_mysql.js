const mysql = require('mysql')

const {
	DATABASE_HOST,
	DATABASE_USER,
	DATABASE_PASSWORD,
	DATABASE,
} = process.env

const dbConnection = mysql.createConnection({
	host: DATABASE_HOST,
	user: DATABASE_USER,
	password: DATABASE_PASSWORD,
	database: DATABASE
})

dbConnection.connect((err) => {
	if (err) {
		console.log(`Database error: ${err}`)
	} else {
		console.log('MySQL Connected...')
	}
})

module.exports = dbConnection