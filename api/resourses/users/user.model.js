const mongoose = require('mongoose');

const userSchema =new mongoose.Schema({
    username:{
        type:String,
        minlength:1,
        required:[true, 'Usuario debe tener un username']
    },
    password:{
        type: String,
        minlength:1,
        required:[true, 'Usuario debe tener un password']
    },
    email:{
        type:String,
        minlength:1,
        required:[true, 'Usuario debe tener un email']
    }
})

module.exports = mongoose.model('user', userSchema);