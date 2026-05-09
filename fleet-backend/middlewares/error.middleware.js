export const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || err.status || 500;
  if (statusCode >= 500) {
    console.error(`[ERROR] ${req.method} ${req.path}`, err);
  }

  // ── Sequelize validation errors (e.g. allowNull, isEmail) ──
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: messages,
    });
  }

  // ── Sequelize unique-constraint errors (e.g. duplicate email) ──
  if (err.name === 'SequelizeUniqueConstraintError') {
    const fields = err.errors.map((e) => e.path);
    return res.status(409).json({
      success: false,
      message: `Duplicate value for: ${fields.join(', ')}`,
    });
  }

  // ── Sequelize foreign-key constraint errors ──
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Cannot delete this record because it is referenced by other records',
    });
  }

  // ── Application errors with an explicit statusCode ──
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Internal server error' : err.message,
  });
};
