const errorHandler = (err, req, res, next) => {

  console.error("ERROR CAUGHT BY MIDDLEWARE");
  console.error(err.stack);

  
  const statusCode = err.statusCode ?? 500;

  res.status(statusCode).json({
    success: false,
    error: {
      statusCode,
      message: err.message || "Internal server error",
    },
  });
};


export default errorHandler
