const logger =  require('../../utils/logger');
const passportJWT = require('passport-jwt');
const config = require('../../config');



const userController = require('../resourses/users/user.controller');

const jwtOptions = {
    secretOrKey : config.jwt.secreto,
    jwtFromRequest : passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken()
}

module.exports = new passportJWT.Strategy(jwtOptions, (jwtPayload, next)=>{
  userController.getOneUser({id:jwtPayload.id})
    .then(user => {
      if(!user){
        logger.warn(`JWT token no valido. Usuario con id ${jwtPayload.id} no  existe`);
        next(null, false);
        return;
      }

      logger.info(`Usuario ${user.username} suministro un token valido. Autenticacion completada`);
      next(null, {
          username: user.username,
          id: user.id,
      })
    })
    .catch(err =>{
      logger.error(`Algo salio mal al tratar de validar el token`, err);
      next(err, false);
    })
});

