const { MongoClient } = require('mongodb')
const fs = require('fs/promises')

const uri = 'mongodb+srv://60304878:<db_password>@web2.o0ci94q.mongodb.net/?appName=Web2'
const client = new MongoClient(uri)
const dbName = 'infs3201_winter2026'
let db

async function connect() {
    await client.connect()
    db = client.db(dbName)
}

async function disconnect() {
    await client.close()
}

/**
 * Employees Collection Methods
 */
async function getAllEmployees() {
    return await db.collection('employees').find().toArray()
}

async function getEmployeeById(eid) {
    return await db.collection('employees').findOne({ employeeId: eid })
}

async function addEmployee(employee) {
    await db.collection('employees').insertOne(employee)
}

/**
 * Shifts Collection Methods
 */
async function getShiftById(sid) {
    return await db.collection('shifts').findOne({ shiftId: sid })
}

/**
 * Assignments Collection Methods
 */
async function getAssignment(eid, sid) {
    return await db.collection('assignments').findOne({ employeeId: eid, shiftId: sid })
}

async function getAssignmentsByEmployee(eid) {
    return await db.collection('assignments').find({ employeeId: eid }).toArray()
}

async function addAssignment(assignment) {
    await db.collection('assignments').insertOne(assignment)
}

/**
 * Configuration Methods
 * Config remains a file system item instead of a database item.
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
