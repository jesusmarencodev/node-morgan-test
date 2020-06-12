const ProductoModel = require('./products.model');

function createProduct(product, dueno) {
	return new ProductoModel({
		...product,
		dueno
	}).save();
}

function getProducts() {
	return ProductoModel.find({});
}

function getProductId(id) {
	return ProductoModel.findById(id);
}
function deleteProduct(id) {
	return ProductoModel.findByIdAndRemove(id);
}

function replaceProduct(id, producto, username) {
	return ProductoModel.findOneAndUpdate(
		{ _id: id },
		{
			...producto,
			dueno: username
		},
		{
			new: true // La opción new es para que la llamada regrese el nuevo documento modificado
		},
		(err, product) => {
			if (err) return err;
			return product;
		}
	);
}

module.exports = {
	createProduct,
	getProducts,
	getProductId,
	deleteProduct,
	replaceProduct
};
