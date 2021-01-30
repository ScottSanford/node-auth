const createError = require('http-errors')
const bcrypt = require('bcryptjs')
const db = require('../helpers/init_mysql')
const { authSchema, loginSchema } = require('../helpers/validation_schema')
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../helpers/jwt_helper')
const { isValidPassword } = require('../helpers/validate_password')
const client = require('../helpers/init_redis')

const login = async (req, res, next) => {
	try {
		
		const { email, password } = await loginSchema.validateAsync(req.body)
		
		db.query('SELECT * FROM user WHERE email = ?', [email], async (error, results) => {
			if (error) {
				return next(createError.InternalServerError())
			}
			
			if (results.length === 0) {
				return next(createError.NotFound('User not registered'))
			}
			
			const doesPasswordMatch = await isValidPassword(password, results[0].password)
			
			if (!doesPasswordMatch) {
				return next(createError.Unauthorized('Username/password not valid'))
			}
			
			const accessToken = await signAccessToken(results[0].id)
			const refreshToken = await signRefreshToken(results[0].id)
			
			res.send({
				accessToken,
				refreshToken
			})
		})
		
	} catch (error) {
		if (error.isJoi) return next(createError.BadRequest('Invalid Username/Password'))
		next(error)
	}
}

const logout = async (req, res, next) => {
	try {
		const { refreshToken } = req.body
		
		if (!refreshToken) {
			return next(createError.BadRequest())
		}
		
		const userId = await verifyRefreshToken(refreshToken)
		
		client.DEL(userId, (err, value) => {
			if (err) {
				console.log(err.message)
				next(createError.InternalServerError())
				return
			}
			console.log(value)
			res.sendStatus(204)
		})
	} catch (error) {
		next(error)
	}
}

const refreshToken = async (req, res, next) => {
	try {

		if (!req.body.refreshToken) {
			return next(createError.BadRequest())
		}
		
		const userId = await verifyRefreshToken(req.body.refreshToken)

		const accessToken = await signAccessToken(userId)
		const refreshToken = await signAccessToken(userId)
		
		res.send({
			accessToken,
			refreshToken
		})
	} catch (error) {
		next(error)
	}
}

const register = async (req, res, next) => {
	console.log(req.body)
	try {
		const {
			firstName,
			lastName,
			email,
			password
		} = await authSchema.validateAsync(req.body)
		
		
		db.query('SELECT email FROM user WHERE email = ?', [email], async (error, results) => {
			if (error) {
				return next(createError.InternalServerError())
			}
			
			if (results.length > 0) {
				return next(createError.Conflict(`${email} is already registered`))
			}
			
			const hashedPassword = await bcrypt.hash(password, 10)
			
			db.query('INSERT INTO user SET ?', {
				first_name: firstName,
				last_name: lastName,
				email,
				password: hashedPassword
			}, async (error, results) => {

				if (error) {
					return next(createError.InternalServerError())
				}
				
				const accessToken = await signAccessToken(results.insertId)
				const refreshToken = await signRefreshToken(results.insertId)

				res.send({
					accessToken,
					refreshToken
				})
			})
		})

	} catch (error) {
		if (error.isJoi) error.status = 422
		next(error)
	}
}

module.exports = {
	login,
	logout,
	register,
	refreshToken
}