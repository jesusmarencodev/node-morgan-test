const mongoose = require('mongoose');

const productSchema =new mongoose.Schema({
    title:{
        type:String,
        required:[true, 'Producto debe tener un titulo']
    },
    price:{
        type: Number,
        min:0,
        required:[true, 'Producto debe tener un precio']
    },
    currency:{
        type:String,
        maxlength:3,
        minlength:3,
        required:[true, 'Producto debe tener una moneda']
    },
    dueno:{
        type:String,
        required:[true, 'Producto debe estar asociado a un usuario']
    }
})

module.exports = mongoose.model('product', productSchema);