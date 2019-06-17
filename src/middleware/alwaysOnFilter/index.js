// TODO Add to a general purpose request processing middleware lib
const alwaysOnFilter = () => (req, res, next) => {
  res.locals.ua = req.get('User-Agent');
  if (res.locals.ua === 'AlwaysOn') {
    return res.status(200).send();
  }
  return next();
};

module.exports = alwaysOnFilter;
