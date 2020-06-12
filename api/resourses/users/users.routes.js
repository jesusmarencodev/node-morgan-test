const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('../../../utils/logger');
const validateUser = require('./users.validate').validarUsuario;
const validarPedidoLogin = require('./users.validate').validarPedidoLogin;
const config = require('../../../config');
const userController = require('./user.controller');
const procesarErrores = require('../../libs/errorHandler').procesarErrores;
const { DatosDeUsuarioYaEnUso, CredencialesIncorrectas } = require('./user.error');

const userRoutes = express.Router();

//midleware para trasnformar usuarios e imails a minusculas
function transformLowercase(req, res, next) {
	req.body.username && (req.body.username = req.body.username.toLowerCase());
	req.body.email && (req.body.email = req.body.email.toLowerCase());
	next();
}

userRoutes.get(
	'/',
	procesarErrores((req, res) => {
		return userController.getUsers().then((users) => {
			logger.info('Users List');
			return res.status(200).json(users);
		})
	})
);

userRoutes.post(
	'/',
	[ validateUser, transformLowercase ],
	procesarErrores((req, res) => {
		let newUser = req.body;
		return userController
			.userExist(newUser.username, newUser.email)
			.then((userExist) => {
				if (userExist) {
					logger.warn(`Email [${newUser.email}] o username [${newUser.username}] ya existen en la db`);
					throw new DatosDeUsuarioYaEnUso();
				}
				//bcrypt retorna una promesa
				return bcrypt.hash(newUser.password, 10);
			})
			.then((hashedPassword) => {
				return userController.createUser(newUser, hashedPassword).then((user) => {
					return res.status(201).send(`Usuario creado exitosamente` );
				});
			});
	})
);

//login
userRoutes.post(
	'/login',
	[ validarPedidoLogin, transformLowercase ],
	procesarErrores(async (req, res) => {
		let userNoAutenticado = req.body;
		let userRegister;

		userRegister = await userController.getOneUser({
			username: userNoAutenticado.username
		});

		if (!userRegister) {
			logger.info(`Usiarp [${userNoAutenticado.username}] no existe. No se pudo autenticar`);
			throw new CredencialesIncorrectas();
		}

		//si existe el usuario
		let passwordCorrecta;

		passwordCorrecta = await bcrypt.compare(userNoAutenticado.password, userRegister.password);

		if (passwordCorrecta) {
			//Generar token
			let token = jwt.sign({ id: userRegister.id }, config.jwt.secreto, {
				expiresIn: config.jwt.tiempoExpiracion
			}); //24 horas para expirar
			logger.info(`Usuario ${userNoAutenticado.username} completo autenticacion exitosamente`);
			return res.status(200).json({ message: 'ok', token });
		} else {
			logger.warn(`fallo la autenticacion, credenciales incorrectas`);
			throw new CredencialesIncorrectas();
		}
	})
);

module.exports = userRoutes;
