const jwt = require('jsonwebtoken')
const createError = require('http-errors')
const client = require('./init_redis')

module.exports = {
	signAccessToken: (userId) => {
		return new Promise((resolve, reject) => {
			const payload = {}
			const secret = process.env.ACCESS_TOKEN_SECRET
			const options = {
				expiresIn: '15s',
				issuer: 'node-auth',
				audience: userId.toString()
			}
			jwt.sign(payload, secret, options, (err, token) => {
				if (err) {
					console.log(err.message)
					return reject(createError.InternalServerError())
				}
				
				resolve(token)
			})
		})
	},
	verifyAccessToken: (req, res, next) => {
		const authHeader = req.headers['authorization']

		if (!authHeader) {
			return next(createError.Unauthorized())
		}
		
		const [, token] = authHeader.split(' ')
		
		jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
			if (err.name !== 'JsonWebTokenError') {
				return next(createError.Unauthorized(err.message))
			}
			
			req.payload = payload
			next()
		})
	},
	signRefreshToken: (userId) => {
		return new Promise((resolve, reject) => {
			const payload = {}
			const secret = process.env.REFRESH_TOKEN_SECRET
			const options = {
				expiresIn: '1y',
				issuer: 'node-auth',
				audience: userId.toString()
			}
			jwt.sign(payload, secret, options, (err, token) => {
				if (err) {
					console.log(err.message)
					reject(createError.InternalServerError())
					return
				}
				
				const yearInSeconds = 365 * 24 * 60 * 60
				
				client.SET(userId, token, 'EX', yearInSeconds, (err, reply) => {
					if (err) {
						console.log(err.message)
						return reject(createError.InternalServerError())
					}
					
					resolve(token)
				})
				
			})
		})
	},
	verifyRefreshToken: (refreshToken) => {
		return new Promise((resolve, reject) => {
			jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, payload) => {
				if (err) {
					reject(createError.Unauthorized())
					return
				}
				const userId = payload.aud
				
				client.GET(userId, (err, result) => {
					if (err) {
						console.log(err.message)
						reject(createError.InternalServerError())
						return
					}
					
					if (refreshToken === result) {
						return resolve(userId)
					}
					
					reject(createError.Unauthorized())
				})

			})
		})
	}
}