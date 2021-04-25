const { response } = require('express');

function errorHandler(err, req, res, next) {
    return response.status(err.status || 500).json({
        error: {
            message: err.message || 'Oops! something went wrong'
        }
    });
}

module.exports = errorHandler;