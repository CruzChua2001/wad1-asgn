const logModel = require('../models/logModel');
const { generateUUID } = require('../utils/uuidUtils');

exports.logger = (req, res, next) => {
    console.log(`UserID ${req.user?.userId ?? "Guest"} Request | ${req.method} ${req.originalUrl}`);

    res.on('finish', async () => {
        // Store the log entry in the database
        const logEntry = {
            LogID: generateUUID(),
            UserID: req.user?.userId || 'Unknown',
            Method: req.method,
            URL: req.originalUrl,
            StatusCode: res.statusCode,
            IP: req.ip,
            UserAgent: req.get('User-Agent'),
        };

        try {
            let response = await logModel.createLog(logEntry);
            if (response) {
                console.log(`UserID ${req.user?.userId ?? "Guest"} Response | ${req.method} ${req.originalUrl} ${res.statusCode}`);
            }
        } catch (error) {
            console.error('Error saving log entry:', error);
        }
    });

    next();
}