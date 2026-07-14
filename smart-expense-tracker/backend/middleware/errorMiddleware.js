const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error console for developer view
  console.error(err);

  // Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new Error(message);
    res.status(404);
  }

  // Mongoose Duplicate Key Error (11000)
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue).join(', ');
    const message = `Duplicate value entered for field(s): ${fields}. Please choose another.`;
    error = new Error(message);
    res.status(400);
  }

  // Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ');
    error = new Error(message);
    res.status(400);
  }

  // Final structured fallback error response
  res.status(res.statusCode === 200 ? 500 : res.statusCode).json({
    success: false,
    error: error.message || 'Server Internal Failure',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - API Endpoint ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = { errorHandler, notFound };
