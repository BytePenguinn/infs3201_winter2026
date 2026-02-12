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
