const generateUUID = () => {
    // Generate a random UUID (version 4)
    return crypto.randomUUID();
}

module.exports = {
    generateUUID
}