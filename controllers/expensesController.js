const Expense = require('../models/Expense')
const asyncHandler = require('express-async-handler')

// @desc get all expenses of specified user
// @route GET /expense
// @access private
const getExpense = asyncHandler(async (req, res) => {

    const userId = req.user

    if (!userId) return res.status(400).json({ message: 'User id is required' })

    const user = await Expense.findOne({ userId: userId }).lean().exec()

    if (!user) {
        return res.status(200).json({ message: 'Expenses not added yet' })
    }

    const data = { data: user.data, currentBalance: user.currentBalance }

    res.send(data)

})

// @desc add new expense
// @route POST /expense
// @access private
const addExpense = asyncHandler(async (req, res) => {
    try {

        const { date, paidTo, paidFor, description, amount } = req.body
        const userId = req.user

        const user = await Expense.findOne({ userId: userId })

        if (!user) {

            const currentBalance = 0
            const expense = new Expense({
                userId,
                currentBalance
            })
            const balance = 0
            expense.data.push({
                date,
                paidTo,
                paidFor,
                amount,
                description,
                balance
            })
            await expense.save()

            return res.status(201).json({ message: "Successfully added..." })

        }

        const balance = user.currentBalance - amount
        user.data.push({
            date,
            paidTo,
            paidFor,
            amount,
            description,
            balance
        })

        await Expense.findOneAndUpdate({ userId: userId }, {
            $set: {
                'currentBalance': user.currentBalance - amount
            }
        })

        user.save()

        res.status(201).json({ message: "Successfully added..." })
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
})

// @desc update expense
// @route PATCH /expense
// @access private
const updateExpense = asyncHandler(async (req, res) => {
    try {
        const { rowId, date, paidTo, paidFor, amount, description } = req.body
        const userId = req.user

        const user = await Expense.findOne({ userId: userId })

        const data = user.data.find(doc => doc._id == rowId)
        data.date = date
        data.paidTo = paidTo
        data.paidFor = paidFor
        data.amount = amount
        data.description = description
        user.save()

        res.send('edited')
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
})

// @desc delete a particular expense of specified user
// @route DELETE /expense
// @access private
const deleteExpense = asyncHandler(async (req, res) => {
    try {
        const { userId, rowId } = req.body
        const user = await Expense.findOne({ userId: userId })

        const itemIndex = user.data.findIndex(({ id }) => id === rowId)
        if (itemIndex >= 0) {
            user.data.splice(itemIndex, 1)
        }
        user.save()
        res.send('deleted')
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

// @desc add balance
// @route PUT /expense/add-balance
// @access private
const addBalance = asyncHandler(async (req, res) => {
    try {
        const { amount, currentBalance } = req.body;
        const userId = req.user
        const user = await Expense.findOne({ userId: userId })

        if (user) {
            await Expense.findOneAndUpdate({ userId: userId }, {
                $set: {
                    "currentBalance": parseInt(amount) + currentBalance
                }
            })
            const data = { data: user.data, currentBalance: user.currentBalance }

            res.send(data)
        } else {
            const currentBalance = amount;
            const user = new Expense({
                userId,
                currentBalance
            })

            const newUser = await user.save();
            res.json({ data: newUser.currentBalance })

        }
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

module.exports = {
    getExpense,
    addExpense,
    updateExpense,
    deleteExpense,
    addBalance
}