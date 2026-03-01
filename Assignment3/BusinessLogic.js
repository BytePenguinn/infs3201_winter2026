const persistence = require('./Persistence')

async function connect() {
    await persistence.connect()
}

async function disconnect() {
    await persistence.disconnect()
}

function isValidPhone(phone) {
    const phoneRegex = /^\d{4}-\d{4}$/
    return phoneRegex.test(phone)
}

function isValidEmployeeId(employeeId) {
    const employeeIdRegex = /^E\d+$/
    return employeeIdRegex.test(employeeId)
}

function isValidShiftId(shiftId) {
    const shiftIdRegex = /^S\d+$/
    return shiftIdRegex.test(shiftId)
}

function isValidName(name) {
    const nameRegex = /^[a-zA-Z\s\-']+$/
    return nameRegex.test(name) && name.trim().length > 0
}

/**
 * Calculates the number of hours between two time strings.
 * 
 * LLM Used: ChatGPT
 * Prompt Used: "Write a javascript function computeShiftDuration(startTime, endTime) which would tell you how many hours (as a real number) between the startTime and endTime"
 * 
 * @param {string} startTime - Start time in HH:MM format
 * @param {string} endTime - End time in HH:MM format
 * @returns {number} The duration in hours
 */
function computeShiftDuration(startTime, endTime) {
    const start = new Date("1970-01-01 " + startTime)
    const end = new Date("1970-01-01 " + endTime)
    
    const diffMs = end - start
    const diffHrs = diffMs / (1000 * 60 * 60)
    
    return diffHrs
}

async function getEmployees() {
    return await persistence.getAllEmployees()
}

async function getShiftById(sid) {
    return await persistence.getShiftById(sid)
}

async function getAssignmentsByEmployee(eid) {
    return await persistence.getAssignmentsByEmployee(eid)
}

async function addEmployeeLogic(name, phone) {
    if (!isValidName(name)) {
        return 'Invalid name format'
    }
    if (!isValidPhone(phone)) {
        return 'Invalid phone format'
    }

    const employees = await persistence.getAllEmployees()
    let max = 0
    
    for (const e of employees) {
        const id = Number(e.employeeId.slice(1))
        if (id > max) {
            max = id
        }
    }

    const nextId = `E${String(max + 1).padStart(3, '0')}`
    const employee = { employeeId: nextId, name, phone }
    
    await persistence.addEmployee(employee)
    return 'Employee added...'
}

async function assignShiftLogic(eid, sid) {
    if (!isValidEmployeeId(eid)) {
        return 'Invalid Employee ID format'
    }
    if (!isValidShiftId(sid)) {
        return 'Invalid Shift ID format'
    }

    const emp = await persistence.getEmployeeById(eid)
    if (!emp) {
        return 'Employee does not exist'
    }
    
    const targetShift = await persistence.getShiftById(sid)
    if (!targetShift) {
        return 'Shift does not exist'
    }
    
    const existingAssignment = await persistence.getAssignment(eid, sid)
    if (existingAssignment) {
        return 'Employee already assigned to shift'
    }

    const config = await persistence.getConfig() 
    let newShiftDuration = computeShiftDuration(targetShift.startTime, targetShift.endTime)

    let currentHours = 0
    const employeeAssignments = await persistence.getAssignmentsByEmployee(eid)
    
    for (const a of employeeAssignments) {
        const s = await persistence.getShiftById(a.shiftId)
        if (s && s.date === targetShift.date) {
            currentHours += computeShiftDuration(s.startTime, s.endTime)
        }
    }

    if ((currentHours + newShiftDuration) > config.maxDailyHours) {
        return `Unable to assign shift: Employee reaches ${currentHours + newShiftDuration} hours on ${targetShift.date}. Limit is ${config.maxDailyHours}.`
    }
    
    const newAssignment = { employeeId: eid, shiftId: sid }
    await persistence.addAssignment(newAssignment)
    return 'Shift Recorded'
}

module.exports = {
    connect,
    disconnect,
    getEmployees,
    getShiftById,
    getAssignmentsByEmployee,
    addEmployeeLogic,
    assignShiftLogic,
    isValidEmployeeId
}
