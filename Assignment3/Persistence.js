const { MongoClient } = require('mongodb')
const fs = require('fs/promises')

const uri = 'mongodb+srv://60304878:12class34@web2.o0ci94q.mongodb.net/?appName=Web2'
const client = new MongoClient(uri)
const dbName = 'infs3201_winter2026'
let db

/**
 * Connects to the MongoDB server and selects the application database.
 * 
 * @returns {Promise<void>}
 */
async function connect() {
    await client.connect()
    db = client.db(dbName)
}

/**
 * Closes the active MongoDB connection.
 * 
 * @returns {Promise<void>}
 */
async function disconnect() {
    await client.close()
}

/**
 * Retrieves all employee documents from the 'employees' collection.
 * 
 * @returns {Promise<Array<Object>>} A list of all employee documents.
 */
async function getAllEmployees() {
    return await db.collection('employees').find().toArray()
}

/**
 * Retrieves a single employee document by their employee ID.
 * 
 * @param {string} eid - The formatted employee ID (e.g., E001).
 * @returns {Promise<Object|null>} The employee document if found, null otherwise.
 */
async function getEmployeeById(eid) {
    return await db.collection('employees').findOne({ employeeId: eid })
}

/**
 * Inserts a new employee document into the 'employees' collection.
 * 
 * @param {Object} employee - The employee object containing employeeId, name, and phone.
 * @returns {Promise<void>}
 */
async function addEmployee(employee) {
    await db.collection('employees').insertOne(employee)
}

/**
 * Retrieves a single shift document by its shift ID.
 * 
 * @param {string} sid - The formatted shift ID (e.g., S001).
 * @returns {Promise<Object|null>} The shift document if found, null otherwise.
 */
async function getShiftById(sid) {
    return await db.collection('shifts').findOne({ shiftId: sid })
}

/**
 * Retrieves an assignment document mapping a specific employee to a specific shift.
 * 
 * @param {string} eid - The employee ID.
 * @param {string} sid - The shift ID.
 * @returns {Promise<Object|null>} The assignment document if found, null otherwise.
 */
async function getAssignment(eid, sid) {
    return await db.collection('assignments').findOne({ employeeId: eid, shiftId: sid })
}

/**
 * Retrieves all assignment documents for a specific employee.
 * 
 * @param {string} eid - The employee ID.
 * @returns {Promise<Array<Object>>} A list of assignment documents belonging to the employee.
 */
async function getAssignmentsByEmployee(eid) {
    return await db.collection('assignments').find({ employeeId: eid }).toArray()
}

/**
 * Inserts a new assignment document into the 'assignments' collection.
 * 
 * @param {Object} assignment - The assignment object containing employeeId and shiftId.
 * @returns {Promise<void>}
 */
async function addAssignment(assignment) {
    await db.collection('assignments').insertOne(assignment)
}

/**
 * Reads and parses the configuration object from the config.json file.
 * Configuration remains file-based as required.
 * 
 * @returns {Promise<Object>} The parsed configuration JSON data.
 */
async function getConfig() {
    let raw = await fs.readFile('config.json', 'utf8')
    let data = JSON.parse(raw)
    return data
}

module.exports = {
    connect,
    disconnect,
    getAllEmployees,
    getEmployeeById,
    addEmployee,
    getShiftById,
    getAssignment,
    getAssignmentsByEmployee,
    addAssignment,
    getConfig
}
