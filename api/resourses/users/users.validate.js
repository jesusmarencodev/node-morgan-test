const Joi = require('joi');
const logger = require('../../../utils/logger');

//planos de datos o blueprint
const bluePrintUsers = Joi.object().keys({
    username: Joi.string().alphanum().min(3).max(30).required(),
	password: Joi.string().min(6).max(200).required(),
	email: Joi.string().email().required()
});

const validarUsuario = (req, res , next) => {
    let  result = Joi.validate(req.body, bluePrintUsers, {abortEarly:false, convert:false});
    
    if(result.error == null){ // si es null pasa la validacion
        next();//dejalo pasar
        return;
    }else{
        let validationErrors = result.error.details.reduce((acumulador, error)=>{
            return acumulador + `[${error.message}]`;
        },"");//cadena vacia es el valor inicial de acumulador
        logger.warn("Usuario no cumple --> describir que debe contener el usuario para ser valido", req.body, validationErrors);
        return res.status(400).json({message:`Usuario no cumple --> describir que debe contener el usuario para ser valido`, validationErrors});
    }
}
//planos de datos o blueprint
const bluePrintPedidoLogin = Joi.object().keys({
    username: Joi.string().required(),
	password: Joi.string().required()
});

const validarPedidoLogin = (req, res , next) => {
    let  result = Joi.validate(req.body, bluePrintPedidoLogin, {abortEarly:false, convert:false});
    
    if(result.error == null){ // si es null pasa la validacion
        next();//dejalo pasar
        return;
    }else{
        let validationErrors = result.error.details.reduce((acumulador, error)=>{
            return acumulador + `[${error.message}]`;
        },"");//cadena vacia es el valor inicial de acumulador
        logger.warn("login fallo no cumplen los campos solicitados", req.body, validationErrors);
        return res.status(400).json({message:`login fallo no cumplen los campos solicitados`, validationErrors});
    }
}

module.exports = {
    validarPedidoLogin,
    validarUsuario
}