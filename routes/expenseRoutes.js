const router = require('express').Router()
const expensesController = require('../controllers/expensesController')
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.route('/')
    .get(expensesController.getExpense)
    .post(expensesController.addExpense)
    .patch(expensesController.updateExpense)
    .delete(expensesController.deleteExpense)

router.route('/add-balance')
    .put(expensesController.addBalance)

module.exports = router