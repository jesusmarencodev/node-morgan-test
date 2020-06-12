const express = require('express');
const passport = require('passport');
const logger = require('../../../utils/logger');
const validateProduct = require('./productValidate');
const productoController = require('./products.controller');
const procesarErrores = require('../../libs/errorHandler').procesarErrores;
const { ProductoNoExiste, UsuarioNoEsDueño } = require('./product.error');

const productsRoutes = express.Router();
const jwtAuthenticate = passport.authenticate('jwt', { session: false });

//middleware ValidarId lo dejamos aqui mismo porque solo lo voy a usar aqui pero es bueno que los middleware esten por fuera
function validateId(req, res, next) {
	let id = req.params.id;
	//regex
	if (id.match(/^[a-fA-F0-9]{24}$/) === null) {
		return res.status(400).json({ message: `the id ${id} no have format valid` });
	}
	next();
}

//get products
productsRoutes.get(
	'/',
	procesarErrores((req, res) => {
		return productoController.getProducts().then((products) => {
			return res.status(200).json({ products });
		});
	})
);

//save product
productsRoutes.post(
	'/',
	[ jwtAuthenticate, validateProduct ],
	procesarErrores((req, res) => {
		return productoController.createProduct(req.body, req.user.username).then((productSave) => {
			//log
			logger.info('Product add colection products', productSave);
			//201 Created success
			return res.status(201).json({ productSave });
		});
	})
);

//get id product
productsRoutes.get(
	'/:id',
	validateId,
	procesarErrores((req, res) => {
		let id = req.params.id;
		return productoController.getProductId(id).then((product) => {
			if (!product) {
				logger.warn(`producto con id ${id} no encontrado`);
				throw new ProductoNoExiste(`producto con id ${id} no encontrado`);
			}
			return res.status(200).json({ product });
		})
	})
);

//put id product
productsRoutes.put(
	'/:id',
	[ jwtAuthenticate, validateId, validateProduct ],
	procesarErrores(async (req, res) => {
		//put reemplazo total de los datos
		let id = req.params.id;
		let product_to_Update;
		let body = req.body;

		//buscamos el producto

		product_to_Update = await productoController.getProductId(id);
		
		//verificamos que el producto si exista
		if (!product_to_Update) {
			logger.warn(`producto con id ${id} no encontrado`);
			throw new ProductoNoExiste(`producto con id ${id} no encontrado`);
		}
		//verificamos que el producto sea de su dueño
		let usuarioAutenticado = req.user.username;
		if (product_to_Update.dueno !== usuarioAutenticado) {
			logger.warn(
				`Usuario ${usuarioAutenticado} no es dueño del producto con ${id}, dueño real es ${product_to_Update.dueno}. Request no procesado`
			);
      throw new UsuarioNoEsDueño(
				`no es dueño del producto, solo puedes procesar productos creados por ti. Request no procesado`
			);
		}
		//actualizamos el producto
		productoController.replaceProduct(id, body, usuarioAutenticado).then((product) => {
			logger.info(`Producto con id ${id} fue update`, product.toObject()); //el .toObject se usa para solo almacenar la informacion de las propieddes principales del objeto
			return res.status(200).json({ message: `Producto con id ${id} fue update`, product });
		});
	})
);

//delete id product
productsRoutes.delete(
	'/:id',
	[ jwtAuthenticate, validateId ],
	procesarErrores(async (req, res) => {
		let id = req.params.id;
		let product_to_Delete;

		product_to_Delete = await productoController.getProductId(id);

		//verificamos que el producto si exista
		if (!product_to_Delete) {
			logger.warn(`producto con id ${id} no encontrado no se pudo borrar`);
			throw new ProductoNoExiste(`producto con id ${id} no encontrado`);
		}
		//verificamos que el producto sea de su dueño
		let usuarioAutenticado = req.user.username;
		if (product_to_Delete.dueno !== usuarioAutenticado) {
			logger.warn(
				`Usuario ${usuarioAutenticado} no es dueño del producto con ${id}, dueño real es ${product_to_Delete.dueno}. Request no procesado`
			);
			throw new UsuarioNoEsDueño(
				`no es dueño del producto, solo puedes procesar productos creados por ti. Request no procesado`
			);
		}
		//borramos el producto

		let productDelete = await productoController.deleteProduct(id);
		logger.info(`Producto con id ${id} fue borrado`);
		return res.status(200).json({ message: `Producto con id ${id} fue borrado`, productDelete });
	})
);

module.exports = productsRoutes;
