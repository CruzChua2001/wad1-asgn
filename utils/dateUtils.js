/**
 * Formats a date and time string into a more readable format.
 * JavaScript Date object to YYYY-MM-DD HH:mm:ss
 * @param {string} dateTimeString - The date and time string to format.
 * @returns {string} The formatted date and time string.
 */
const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

module.exports = { formatDateTime };