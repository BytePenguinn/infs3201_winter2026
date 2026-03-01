const prompt = require('prompt-sync')()
const logic = require('./BusinessLogic')

/**
 * Loads employee data and displays a formatted list.
 * Logic fetched from business layer, display loop stays here.
 */
async function listEmployees() {
    const data = await logic.getEmployees()
    console.log('Employee ID Name                Phone')
    console.log('----------- ------------------- ---------')
    
    for (const e of data) {
        let idPart = e.employeeId.padEnd(12)
        let namePart = e.name.padEnd(20)
        console.log(`${idPart}${namePart}${e.phone}`)
    }
} 

async function addEmployee() {
    let name = prompt("Enter employee name: ")
    let phone = prompt("Enter phone number: ")
    let message = await logic.addEmployeeLogic(name, phone)
    console.log(message)
}

async function assignShift() {
    let eid = prompt("Enter employee ID: ")
    let sid = prompt("Enter shift ID: ")
    let message = await logic.assignShiftLogic(eid, sid)
    console.log(message)
}

async function viewEmployeeSchedule(eid) {
    if (!logic.isValidEmployeeId(eid)) {
        console.log('Invalid Employee ID format')
        return
    }

    const assignments = await logic.getAssignmentsByEmployee(eid)
    
    console.log('date,startTime,endTime')
    
    for (const a of assignments) {
        const s = await logic.getShiftById(a.shiftId)
        if (s) {
            console.log(`${s.date},${s.startTime},${s.endTime}`)
        }
    }
}

async function app() {
    await logic.connect()
    
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
            await addEmployee()
        }
        else if (selection === '3') {
            await assignShift()
        }
        else if (selection === '4') {
            let eid = prompt("Enter employee ID: ")
            await viewEmployeeSchedule(eid)
        }
        else if (selection === '5') {
            await logic.disconnect()
            break
        }
        else {
            console.log('Choose a number between 1 and 5')
        }
    }
}

app()
