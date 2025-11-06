const timeout = (ms) => {
  return (req, res, next) => {
    res.setTimeout(ms, () => {
      if (!res.headersSent) {
        res.status(503).json({
          success: false,
          error: 'Timeout',
          message: 'La requête a pris trop de temps'
        });
      }
    });
    next();
  };
};

module.exports = timeout;
