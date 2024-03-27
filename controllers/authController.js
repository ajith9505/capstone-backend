const User = require('../models/User')
const Expense = require('../models/Expense')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const asyncHandler = require('express-async-handler')

// @desc Register
// @route POST /auth/register
// @access public
const register = asyncHandler(async (req, res) => {


    const { username, email, password } = req.body

    //verifying data
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    //checking the email alredy resisterd or not
    const isDuplicate = await User.findOne({ email: email }).lean().exec()

    if (isDuplicate) {
        return res.status(409).json({ message: 'User already exists' })
    }

    const hashPassword = await bcrypt.hash(password, 12)

    //creating new user
    const user = new User({
        username: username,
        email: email,
        password: hashPassword
    })

    await user.save()

    res.json({ message: `User ${user.username} was registerd successfully` })

})

// @desc Login
// @route POST /auth
// @access public
const login = asyncHandler(async (req, res) => {

    //verifying data
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    const user = await User.findOne({ email: email }).lean().exec()

    //checking the user existance in database
    if (!user) {
        return res.status(401).json({ message: 'User not found' })
    }

    //checking password with user data
    const isPasswordMatch = await bcrypt.compare(password, user.password)

    if (!isPasswordMatch) {
        return res.status(401).json({ message: 'Incorrect password' })
    }

    const payload = {
        user: {
            id: user._id,
            name: user.username,
            email: user.email
        }
    }

    //creating jwt access token
    const accessToken = jwt.sign(
        payload,
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
    )

    //creating jwt refresh token
    const refreshToken = jwt.sign(
        { 'email': user.email },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "1d" }
    )

    //creating secure cookies
    res.cookie('jwt', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: 7 * 24 * 60 * 60 * 1000
    })

    //sending the access token
    res.json({ accessToken })
})

// @desc Refresh
// @route GET /auth/refresh
// @access public
const refresh = asyncHandler(async (req, res) => {
    const cookies = req.cookies
    //verifying data
    if (!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized' })


    const refreshToken = cookies.jwt

    //verifying jwt token
    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        asyncHandler(async (error, decoded) => {
            if (error) return res.status(403).json({ message: 'Forbbiden' })
            const email = decoded.email
           
            const user = await User.findOne({ email: email })

            if (!user) return res.status(401).json({ message: 'Unauthorized' })

            const payload = {
                user: {
                    id: user._id,
                    name: user.username,
                    email: user.email
                }
            }

            const accessToken = jwt.sign(
                payload,
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: "15m" }
            )
            res.json({ accessToken })
        })
    )
})

// @desc Logout
// @route POST /auth/logout
// @access public
const logout = asyncHandler(async (req, res) => {
    const cookies = req.body

    if (cookies?.jwt) return res.status(201)

    res.clearCookie('jwt', {
        httpOnly: true,
        secure: true,
        sameSite: 'None'
    })

    res.json({ message: 'Cookies cleard' })
})

module.exports = {
    login,
    register,
    refresh,
    logout
}