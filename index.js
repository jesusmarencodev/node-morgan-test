//requires libreries
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const passport = require('passport');
const morgan = require('morgan');
const mongoose = require('mongoose');

const productsRoutes = require('./api/resourses/products/products.routes');
const usersRoutes = require('./api/resourses/users/users.routes');
const logger = require('./utils/logger');
const authJWT = require('./api/libs/auth');
const config = require('./config');
const errorHandler = require('./api/libs/errorHandler');

passport.use(authJWT);

mongoose.connect('mongodb://127.0.0.1:27017/appDelante', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.connection.on('error', () => {
	logger.error('Fallo la conexion a mongoDB');
	process.exit(1);
});
mongoose.set('useFindAndModify', false) //desactivar los warnings de  useFindAndModify


//variables
const app = express();

app.use(bodyParser.json()); //parsear  las peticiones y respuestas a json
// genera logs de las peticiones, si lo combinamos con morgan podemos guardar esos logs
app.use(
	morgan('short', {
		stream: {
			write: (message) => logger.info(message.trim()) // combinamos con logger
		}
	})
);

//configuracion de Cors(cabeceras http)
app.use(cors());

//Rutas
app.use('/products', productsRoutes);
app.use('/users', usersRoutes);

app.use(errorHandler.procesarErroresDeDB);
if (config.ambiente === 'prod' || config.ambiente === 'produccion') {
	app.use(errorHandler.erroresEnProduccion);
} else {
	app.use(errorHandler.erroresEnDesarrollo);
}


const server = app.listen(config.puerto, () => {
	logger.info(`listening in port ${config.puerto}`);
});


module.exports = {
	app,
	server
}