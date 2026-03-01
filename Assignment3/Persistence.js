const fs = require('fs/promises')

/**
 * Reads a file from the file system and parses it as JSON.
 * Copied from original loadData
 */
async function loadData(file) {
    let raw = await fs.readFile(file, 'utf8')
    let data = JSON.parse(raw)
    return data
}

/**
 * Writes data to a file.
 * Helper added to replace direct fs.writeFile calls in logic
 */
async function saveData(file, data) {
    await fs.writeFile(file, JSON.stringify(data, null, 2))
}

module.exports = { loadData, saveData }
