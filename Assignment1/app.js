const fs = require('fs/promises')
const prompt = require('prompt-sync')()

/**
 * Reads a file from the file system and parses it as JSON.
 * 
 * @async
 * @param {string} file - The path to the JSON file to be read.
 * @returns {Promise<Array>} A promise that resolves to the parsed data array.
 */
async function loadData(file) {
    let raw = await fs.readFile(file, 'utf8')
    let data = JSON.parse(raw)
    return data
}

/**
 * Checks if a specific ID exists within an array of objects.
 * 
 * @async
 * @param {string|number} id - The ID value to search for.
 * @param {Array<Object>} dataArray - The array of data objects to search through.
 * @param {string} propertyName - The property key in the objects to compare against the ID.
 * @returns {Promise<boolean>} A promise that resolves to true if the ID is found.
 */
async function doesIdExist(id, dataArray, propertyName) {
    for (const item of dataArray) {
        if (item[propertyName] === id) {
            return true
        }
    }
    return false
}


/**
 * Validates that a phone number matches the specific format XXXX-XXXX.
 * Accepts only: 4 digits, a hyphen, followed by 4 digits (e.g., 5555-0103).
 * 
 * @param {string} phone - The phone number string to validate.
 * @returns {boolean} True if the phone number matches the XXXX-XXXX format.
 */
function isValidPhone(phone) {
    const phoneRegex = /^\d{4}-\d{4}$/
    return phoneRegex.test(phone)
}

/**
 * Validates that an employee ID follows the correct format (E followed by digits).
 * 
 * @param {string} employeeId - The employee ID to validate.
 * @returns {boolean} True if the employee ID format is valid, false otherwise.
 */
function isValidEmployeeId(employeeId) {
    const employeeIdRegex = /^E\d+$/
    return employeeIdRegex.test(employeeId)
}

/**
 * Validates that a shift ID follows the correct format (S followed by digits).
 * 
 * @param {string} shiftId - The shift ID to validate.
 * @returns {boolean} True if the shift ID format is valid, false otherwise.
 */
function isValidShiftId(shiftId) {
    const shiftIdRegex = /^S\d+$/
    return shiftIdRegex.test(shiftId)
}


/**
 * Validates that a name contains only letters, spaces, hyphens, and apostrophes.
 * 
 * @param {string} name - The name to validate.
 * @returns {boolean} True if the name format is valid, false otherwise.
 */
function isValidName(name) {
    const nameRegex = /^[a-zA-Z\s\-']+$/
    return nameRegex.test(name) && name.trim().length > 0
}


/**
 * Loads employee data and displays a formatted list of all employees.
 * Matches the specific table format required in the assignment.
 * 
 * @async
 * @returns {Promise<void>}
 */
async function listEmployees() {
    const data = await loadData('employees.json')
    console.log('Employee ID Name                Phone')
    console.log('----------- ------------------- ---------')
    
    for (const e of data) {
        // padEnd is used to ensure columns line up as per the sample output
        let idPart = e.employeeId.padEnd(12)
        let namePart = e.name.padEnd(20)
        console.log(`${idPart}${namePart}${e.phone}`)
    }
} 

/**
 * Adds a new employee to the system with an auto-incrementing ID.
 * 
 * @async
 * @param {string} name - The name of the employee.
 * @param {string} phone - The phone number of the employee.
 * @returns {Promise<void>}
 */
async function addEmployee(name, phone) {
    if (!isValidName(name)) {
        console.log('Invalid name format')
        return
    }
    if (!isValidPhone(phone)) {
        console.log('Invalid phone format')
        return
    }

    const data = await loadData('employees.json')
    let max = 0
    
    for (const e of data) {
        const id = Number(e.employeeId.slice(1))
        if (id > max) {
            max = id
        }
    }

    const nextId = `E${String(max + 1).padStart(3, '0')}`
    const employee = { employeeId: nextId, name, phone }
    
    data.push(employee)
    await fs.writeFile('employees.json', JSON.stringify(data, null, 2))
    console.log('Employee added...')
}

/**
 * Assigns a specific employee to a specific shift.
 * Enforces referential integrity and composite key uniqueness.
 * 
 * @async
 * @param {string} eid - The Employee ID.
 * @param {string} sid - The Shift ID.
 * @returns {Promise<void>}
 */
async function assignShift(eid, sid) {
    if (!isValidEmployeeId(eid)) {
        console.log('Invalid Employee ID format')
        return
    }
    if (!isValidShiftId(sid)) {
        console.log('Invalid Shift ID format')
        return
    }

    const employees = await loadData('employees.json')
    const shifts = await loadData('shifts.json')
    const assignments = await loadData('assignments.json')
    
    const employeeExists = await doesIdExist(eid, employees, 'employeeId')
    const shiftExists = await doesIdExist(sid, shifts, 'shiftId')
    
    if (!employeeExists) {
        console.log('Employee does not exist')
        return
    }
    
    if (!shiftExists) {
        console.log('Shift does not exist')
        return
    }
    
    for (const a of assignments) {
        if (a.employeeId === eid && a.shiftId === sid) {
            console.log('Employee already assigned to shift')
            return
        }
    }
    
    const newAssignment = { employeeId: eid, shiftId: sid }
    assignments.push(newAssignment)
    await fs.writeFile('assignments.json', JSON.stringify(assignments, null, 2))
    console.log('Shift Recorded')
}

/**
 * Displays the schedule for a specific employee in CSV compatible format.
 * 
 * @async
 * @param {string} eid - The Employee ID to filter by.
 * @returns {Promise<void>}
 */
async function viewEmployeeSchedule(eid) {
    if (!isValidEmployeeId(eid)) {
        console.log('Invalid Employee ID format')
        return
    }

    const assignments = await loadData('assignments.json')
    const shifts = await loadData('shifts.json')
    
    console.log('date,startTime,endTime')
    
    for (const a of assignments) {
        if (a.employeeId === eid) {
            for (const s of shifts) {
                if (s.shiftId === a.shiftId) {
                    console.log(`${s.date},${s.startTime},${s.endTime}`)
                }
            }
        }
    }
}

/**
 * Main application loop.
 * 
 * @async
 * @returns {Promise<void>}
 */
async function app() {
    while (true) {
        console.log('1. Show all employees')
        console.log('2. Add new employee')
        console.log('3. Assign employee to shift')
        console.log('4. View employee schedule')
        console.log('5. Exit')
        
        let selection = prompt("What is your choice> ")
        
        if (selection === '1') {
            await listEmployees()
        }
        else if (selection === '2') {
            let name = prompt("Enter employee name: ")
            let phone = prompt("Enter phone number: ")
            await addEmployee(name, phone)
        }
        else if (selection === '3') {
            let eid = prompt("Enter employee ID: ")
            let sid = prompt("Enter shift ID: ")
            await assignShift(eid, sid)
        }
        else if (selection === '4') {
            let eid = prompt("Enter employee ID: ")
            await viewEmployeeSchedule(eid)
        }
        else if (selection === '5') {
            break
        }
        else {
            console.log('Choose a number between 1 and 5')
        }
    }
}

app()
