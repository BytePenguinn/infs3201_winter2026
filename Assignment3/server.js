const express = require('express')
const { engine } = require('express-handlebars')
const logic = require('./BusinessLogic')

const app = express()
const PORT = 8000

app.engine('.hbs', engine({ extname: '.hbs', defaultLayout: false }))
app.set('view engine', '.hbs')
app.set('views', './views')

app.use(express.urlencoded({ extended: true }))

/**
 * Route handler for the landing page.
 * Fetches all employees from the business logic and renders them in the home view.
 * 
 * @param {express.Request} req - The Express request object.
 * @param {express.Response} res - The Express response object.
 * @returns {Promise<void>}
 */
app.get('/', async (req, res) => {
    const employees = await logic.getEmployees()
    res.render('home', { employees })
})

/**
 * Route handler for the Employee Details page.
 * Fetches employee information and their assigned shifts, then renders the employee view.
 * 
 * @param {express.Request} req - The Express request object.
 * @param {express.Response} res - The Express response object.
 * @returns {Promise<void>}
 */
app.get('/employee/:eid', async (req, res) => {
    const eid = req.params.eid
    const data = await logic.getEmployeeDetails(eid)
    
    if (!data) {
        return res.status(404).send('Employee not found')
    }

    res.render('employee', data)
})

/**
 * Route handler to display the Edit Employee form.
 * 
 * @param {express.Request} req - The Express request object.
 * @param {express.Response} res - The Express response object.
 * @returns {Promise<void>}
 */
app.get('/edit/:eid', async (req, res) => {
    const eid = req.params.eid
    const employee = await logic.getEmployeeById(eid)
    
    if (!employee) {
        return res.status(404).send('Employee not found')
    }

    res.render('edit', { employee })
})

/**
 * Route handler to process the Edit Employee form submission.
 * Triggers server-side validation. On success, redirects to landing page (PRG).
 * On failure, sends a simple error message.
 * 
 * @param {express.Request} req - The Express request object.
 * @param {express.Response} res - The Express response object.
 * @returns {Promise<void>}
 */
app.post('/edit/:eid', async (req, res) => {
    const eid = req.params.eid
    const { name, phone } = req.body

    const result = await logic.editEmployeeLogic(eid, name, phone)

    if (result.success) {
        res.redirect('/')
    } else {
        res.send(result.message)
    }
})

/**
 * Connects to the database and starts the Express web server.
 * 
 * @returns {Promise<void>}
 */
async function startServer() {
    await logic.connect()
    app.listen(PORT, () => {
        console.log(`Server is running on http://127.0.0.1:${PORT}`)
    })
}

startServer()
