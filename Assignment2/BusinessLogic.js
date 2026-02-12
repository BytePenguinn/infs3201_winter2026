const persistence = require('./Persistence')


function doesIdExist(id, dataArray, propertyName) {
    for (const item of dataArray) {
        if (item[propertyName] === id) {
            return true
        }
    }
    return false
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
    const start = new Date("1970-01-01 " + startTime);
    const end = new Date("1970-01-01 " + endTime);
    
    const diffMs = end - start;
    
    const diffHrs = diffMs / (1000 * 60 * 60);
    
    return diffHrs;
}


async function getEmployees() {
    return await persistence.loadData('employees.json')
}

async function getShifts() {
    return await persistence.loadData('shifts.json')
}

async function getAssignments() {
    return await persistence.loadData('assignments.json')
}

async function addEmployeeLogic(name, phone) {
    if (!isValidName(name)) {
        return 'Invalid name format'
    }
    if (!isValidPhone(phone)) {
        return 'Invalid phone format'
    }

    const data = await persistence.loadData('employees.json')
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
    await persistence.saveData('employees.json', data)
    return 'Employee added...'
}

async function assignShiftLogic(eid, sid) {
    if (!isValidEmployeeId(eid)) {
        return 'Invalid Employee ID format'
    }
    if (!isValidShiftId(sid)) {
        return 'Invalid Shift ID format'
    }

    const employees = await persistence.loadData('employees.json')
    const shifts = await persistence.loadData('shifts.json')
    const assignments = await persistence.loadData('assignments.json')
    const config = await persistence.loadData('config.json') 
    
    const employeeExists = doesIdExist(eid, employees, 'employeeId')
    const shiftExists = doesIdExist(sid, shifts, 'shiftId')
    
    if (!employeeExists) {
        return 'Employee does not exist'
    }
    
    if (!shiftExists) {
        return 'Shift does not exist'
    }
    
    for (const a of assignments) {
        if (a.employeeId === eid && a.shiftId === sid) {
            return 'Employee already assigned to shift'
        }
    }


    let targetShift = null;
    for (const s of shifts) {
        if (s.shiftId === sid) {
            targetShift = s;
        }
    }

    let newShiftDuration = computeShiftDuration(targetShift.startTime, targetShift.endTime);

    let currentHours = 0;
    
    for (const a of assignments) {
        if (a.employeeId === eid) {
            for (const s of shifts) {
                if (s.shiftId === a.shiftId) {
                    if (s.date === targetShift.date) {
                        currentHours += computeShiftDuration(s.startTime, s.endTime);
                    }
                }
            }
        }
    }

    if ((currentHours + newShiftDuration) > config.maxDailyHours) {
        return `Unable to assign shift: Employee reaches ${currentHours + newShiftDuration} hours on ${targetShift.date}. Limit is ${config.maxDailyHours}.`
    }
    
    
    const newAssignment = { employeeId: eid, shiftId: sid }
    assignments.push(newAssignment)
    await persistence.saveData('assignments.json', assignments)
    return 'Shift Recorded'
}

module.exports = {
    getEmployees,
    getShifts,
    getAssignments,
    addEmployeeLogic,
    assignShiftLogic,
    isValidEmployeeId
}
