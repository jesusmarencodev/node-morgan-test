const Joi = require('joi');
const logger = require('../../../utils/logger');

//planos de datos o blueprint
const bluePrintProduct = Joi.object().keys({
	title: Joi.string().max(100).required(),
	price: Joi.number().positive().precision(2).required(),
    currency: Joi.string().length(3).uppercase().required(),
    dueno: Joi.string().max(100).required()
});

module.exports = (req, res, next) => {
	let result = Joi.validate(req.body, bluePrintProduct, { abortEarly: false, convert: false });

	if (result.error == null) {
		// si es null pasa la validacion
		next(); //dejalo pasar
		return;
	} else {
		let validationErrors = result.error.details.reduce((acumulador, error) => {
			return acumulador + `[${error.message}]`;
		}, ''); //cadena vacia es el valor inicial de acumulador
		logger.warn('Product not pass validation', req.body, validationErrors);
		return res
			.status(400)
			.json({ message: `El producto debe especificar title, price, currency`, validationErrors });
	}
};
