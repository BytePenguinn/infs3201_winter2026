const express = require('express')
const { engine } = require('express-handlebars')
const logic = require('./BusinessLogic')

const app = express()
const PORT = 8000

app.engine('.hbs', engine({ extname: '.hbs', defaultLayout: false }))
app.set('view engine', '.hbs')
app.set('views', './views')

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
