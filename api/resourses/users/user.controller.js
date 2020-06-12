const UserModel = require('./user.model');


function getUsers(){
  return UserModel.find({});
}


function userExist(username, email){
  return new Promise((resolve, reject)=>{
    UserModel.find().or([{'username':username}, {'email':email}])
    .then(users =>{
      // si usuario.length > 0 devuelve true, es decir existe uno o mas usuarios encontrados
      resolve(users.length > 0);
    })
    .catch(err =>{
      reject(err)
    })
  })
}

function createUser(user, hashedPassword){
  return new UserModel({
    ...user,
    password: hashedPassword
  }).save();
}

function getOneUser({
  username: username,
  id: id //id va a quedar vacio, es un argumento opcional
}){
  if(username) return UserModel.findOne({username:username});
  if(id) return UserModel.findById(id);

  throw new Error(`Funcion obtener usuario del controller fue llamada sin especificar username o id`);
}

module.exports = {
    getUsers,
    createUser,
    userExist,
    getOneUser
}