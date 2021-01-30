const bcrypt = require('bcryptjs')

const isValidPassword = async (password, hashedPassword) => {
	try {
		return await bcrypt.compare(password, hashedPassword)
	} catch (error) {
		throw error
	}
}

module.exports = {
	isValidPassword
}