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
 * Validates an employee name (letters, spaces, hyphens, and apostrophes only, must not be empty).
 * 
 * @param {string} name - The name string to validate.
 * @returns {boolean} True if valid, false otherwise.
 */
function isValidName(name) {
    const nameRegex = /^[a-zA-Z\s\-']+$/
    return nameRegex.test(name) && name.length > 0
}

/**
 * Calculates the number of hours between two time strings.
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
 * Determines if a given time is before 12:00 PM (Noon).
 * 
 * @param {string} timeStr - The time string in "HH:MM" format.
 * @returns {boolean} True if the hour is less than 12, false otherwise.
 */
function isBeforeNoon(timeStr) {
    const hour = parseInt(timeStr.split(':')[0], 10)
    return hour < 12
}

/**
 * Sorts an array of shifts by date and time in ascending order using Bubble Sort.
 * Strict avoidance of Array.prototype.sort() callback.
 * 
 * @param {Array<Object>} shifts - The array of shift objects to sort.
 * @returns {Array<Object>} The sorted array.
 */
function sortShifts(shifts) {
    let n = shifts.length
    let swapped = true
    
    while (swapped) {
        swapped = false
        for (let i = 0; i < n - 1; i++) {
            let swapNeeded = false
            
            if (shifts[i].date > shifts[i+1].date) {
                swapNeeded = true
            } else if (shifts[i].date === shifts[i+1].date) {
                if (shifts[i].startTime > shifts[i+1].startTime) {
                    swapNeeded = true
                }
            }
            
            if (swapNeeded) {
                let temp = shifts[i]
                shifts[i] = shifts[i+1]
                shifts[i+1] = temp
                swapped = true
            }
        }
        n--
    }
    
    return shifts
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
 * Retrieves a single employee by their ID.
 * 
 * @param {string} eid - The employee ID.
 * @returns {Promise<Object|null>} The employee object.
 */
async function getEmployeeById(eid) {
    return await persistence.getEmployeeById(eid)
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
 * Gathers complete details and properly formatted/sorted shifts for an employee.
 * 
 * @param {string} eid - The employee ID.
 * @returns {Promise<Object|null>} An object containing the employee details and an array of their shifts.
 */
async function getEmployeeDetails(eid) {
    const employee = await persistence.getEmployeeById(eid)
    if (!employee) return null

    const assignments = await persistence.getAssignmentsByEmployee(eid)
    const rawShifts = []

    for (const a of assignments) {
        const s = await persistence.getShiftById(a.shiftId)
        if (s) {
            rawShifts.push({
                date: s.date,
                startTime: s.startTime,
                endTime: s.endTime,
                isMorningStart: isBeforeNoon(s.startTime),
                isMorningEnd: isBeforeNoon(s.endTime)
            })
        }
    }

    const sortedShifts = sortShifts(rawShifts)

    return {
        employee: employee,
        shifts: sortedShifts
    }
}

/**
 * Validates and updates an employee's details in the database.
 * 
 * @param {string} eid - The employee ID.
 * @param {string} name - The submitted name.
 * @param {string} phone - The submitted phone number.
 * @returns {Promise<Object>} Object with success status and optional message.
 */
async function editEmployeeLogic(eid, name, phone) {
    const trimmedName = (name || '').trim()
    const trimmedPhone = (phone || '').trim()

    if (!isValidName(trimmedName)) {
        return { success: false, message: 'Invalid or empty name provided.' }
    }

    if (!isValidPhone(trimmedPhone)) {
        return { success: false, message: 'Invalid phone format. Must be 4 digits, a dash, then 4 digits (e.g., 5555-1234).' }
    }

    await persistence.updateEmployee(eid, trimmedName, trimmedPhone)

    return { success: true }
}

/**
 * Adds a new employee to the system with auto-incremented ID formatting.
 * 
 * @param {string} name - The name of the new employee.
 * @param {string} phone - The phone number of the new employee.
 * @returns {Promise<string>} A status message regarding the operation.
 */
async function addEmployeeLogic(name, phone) {
    const trimmedName = (name || '').trim()
    const trimmedPhone = (phone || '').trim()

    if (!isValidName(trimmedName)) {
        return 'Invalid name format'
    }
    if (!isValidPhone(trimmedPhone)) {
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
    const employee = { employeeId: nextId, name: trimmedName, phone: trimmedPhone }
    
    await persistence.addEmployee(employee)
    return 'Employee added...'
}


module.exports = {
    connect,
    disconnect,
    getEmployees,
    getEmployeeById,
    getShiftById,
    getAssignmentsByEmployee,
    getEmployeeDetails,
    editEmployeeLogic,
    addEmployeeLogic,
}
