const Joi = require('joi')

const authSchema = Joi.object({
	firstName: Joi.string().required(),
	lastName: Joi.string().required(),
	email: Joi.string().email().required(),
	password: Joi.string()
		.regex(new RegExp(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,30}$/))
		.required()
})

const loginSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string()
		.regex(new RegExp(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,30}$/))
		.required()
})

module.exports = { authSchema, loginSchema }