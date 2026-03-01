const persistence = require('./Persistence')

/**
 * Establishes a connection to the persistence layer.
 * 
 * @returns {Promise<void>}
 */
async function connect() {
    await persistence.connect()
}

/**
 * Disconnects from the persistence layer.
 * 
 * @returns {Promise<void>}
 */
async function disconnect() {
    await persistence.disconnect()
}

/**
 * Validates the phone number format (must be 4 digits, a hyphen, and 4 digits).
 * 
 * @param {string} phone - The phone number string to validate.
 * @returns {boolean} True if valid, false otherwise.
 */
function isValidPhone(phone) {
    const phoneRegex = /^\d{4}-\d{4}$/
    return phoneRegex.test(phone)
}

/**
 * Validates the employee ID format (must start with 'E' followed by numbers).
 * 
 * @param {string} employeeId - The employee ID string to validate.
 * @returns {boolean} True if valid, false otherwise.
 */
function isValidEmployeeId(employeeId) {
    const employeeIdRegex = /^E\d+$/
    return employeeIdRegex.test(employeeId)
}

/**
 * Validates the shift ID format (must start with 'S' followed by numbers).
 * 
 * @param {string} shiftId - The shift ID string to validate.
 * @returns {boolean} True if valid, false otherwise.
 */
function isValidShiftId(shiftId) {
    const shiftIdRegex = /^S\d+$/
    return shiftIdRegex.test(shiftId)
}

/**
 * Validates an employee name (letters, spaces, hyphens, and apostrophes only, must not be empty).
 * 
 * @param {string} name - The name string to validate.
 * @returns {boolean} True if valid, false otherwise.
 */
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
 * @param {string} startTime - Start time in HH:MM format.
 * @param {string} endTime - End time in HH:MM format.
 * @returns {number} The duration in hours.
 */
function computeShiftDuration(startTime, endTime) {
    const start = new Date("1970-01-01 " + startTime)
    const end = new Date("1970-01-01 " + endTime)
    
    const diffMs = end - start
    const diffHrs = diffMs / (1000 * 60 * 60)
    
    return diffHrs
}

/**
 * Retrieves all employees.
 * 
 * @returns {Promise<Array<Object>>} An array of employee objects.
 */
async function getEmployees() {
    return await persistence.getAllEmployees()
}

/**
 * Retrieves a single shift by its ID.
 * 
 * @param {string} sid - The shift ID.
 * @returns {Promise<Object|null>} The shift object if found, otherwise null.
 */
async function getShiftById(sid) {
    return await persistence.getShiftById(sid)
}

/**
 * Retrieves all assignments for a specific employee.
 * 
 * @param {string} eid - The employee ID.
 * @returns {Promise<Array<Object>>} An array of assignment objects.
 */
async function getAssignmentsByEmployee(eid) {
    return await persistence.getAssignmentsByEmployee(eid)
}

/**
 * Adds a new employee to the system with auto-incremented ID formatting.
 * 
 * @param {string} name - The name of the new employee.
 * @param {string} phone - The phone number of the new employee.
 * @returns {Promise<string>} A status message regarding the operation.
 */
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

/**
 * Assigns an employee to a shift, enforcing configuration constraints and rules.
 * 
 * @param {string} eid - The employee ID.
 * @param {string} sid - The shift ID.
 * @returns {Promise<string>} A status message indicating success or the reason for failure.
 */
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
