/**
 * Middleware to handle 404 Not Found errors.
 * Captures the requested URL and forwards a 404 Error to the global handler.
 */
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

/**
 * Global Error Handler middleware.
 * Formats errors and sends JSON responses. Includes stack traces only in development.
 * @param {Error} err - Error object.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next function.
 */
const errorHandler = (err, req, res, next) => {
    // If headers have already been sent, delegate to the default Express error handler 
    // to avoid "Headers already sent" errors.
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
};

export { notFound, errorHandler };