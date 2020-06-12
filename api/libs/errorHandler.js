const logger = require('../../utils/logger');
const mongoose = require('mongoose');


exports.procesarErrores = (fn) => {
  return function(req, res, next){
    fn(req, res, next).catch(next);
  }
}


exports.procesarErroresDeDB = (err, req, res, next) => {
  if(err instanceof mongoose.Error || err.name === 'MongoError'){
    logger.error(`Ocurrio un error relacionado con mongoose`);
    err.message = "Ocurrio un error inesperado relacionado a la base de datos, para ayudarte contacta a jesusmarencodev@gmail.com";
    err.status = 500;
  }
  next(err);
}

exports.erroresEnProduccion = (err, req, res, next) => {
  res.status(err.status || 500 );
  return res.json({message:err.message})
}


exports.erroresEnDesarrollo = (err, req, res, next) => {
  res.status(err.status || 500 );
  return res.json({message:err.message, stack: err.stack || ''});
}