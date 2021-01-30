const express = require('express')
const morgan = require('morgan')
const createError = require('http-errors')
require('dotenv').config({path: './.env'})
require('./helpers/init_mysql')
const { verifyAccessToken } = require('./helpers/jwt_helper')
require('./helpers/init_redis')

const { PORT } = process.env


const AuthRoute = require('./routes/auth.route')

const app = express()
app.use(morgan('dev'))
app.use(express.json())

app.get('/', verifyAccessToken, async (req, res, next) => {
	console.log(req.headers['authorization'])
	res.send('Hello from express')
})

app.use('/auth', AuthRoute)

app.use(async (req, res, next) => {
	next(createError.NotFound('This route does not exist'))
})

app.use((err, req, res, next) => {
	res.status(err.status || 500)
	res.send({
		error: {
			status: err.status || 500,
			message: err.message
		}
	})
})

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT || 3000}`)
})