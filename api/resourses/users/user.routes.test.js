let request     = require('supertest');
const bcrypt    = require('bcrypt');
const jwt       = require('jsonwebtoken');
const mongoose = require('mongoose');

const UserModel = require('./user.model');
const app       = require('../../../index').app;
const server    = require('../../../index').server;
const config    = require('../../../config');

const dummyUsers = [
  {
    username  : 'daniel',
    email     : 'daniel@daniel.com',
    password  : 'elpassword'
  },
  {
    username  : 'jesus',
    email     : 'jesus@jesus.com',
    password  : 'elpassword123'
  },
  {
    username  : 'marenco',
    email     : 'marenco@marenco.com',
    password  : 'marenco123'
  }

];

const userNew = {
  username  : 'jdmarencoporto',
  email     : 'jesus@hotmail.com',
  password  : 'elpassword'
}

function usuarioExisteYAtributosSonCorrectos(user, done){
  UserModel.find({username:user.username})
    .then(users =>{
      expect(users).toBeInstanceOf(Array)
      expect(users).toHaveLength(1)
      expect(users[0].username).toEqual(user.username)
      expect(users[0].email).toEqual(user.email)

      let iguales = bcrypt.compareSync(user.password, users[0].password);
      expect(iguales).toBeTruthy()
      done()
    })
    .catch(err =>{
      done(err);
    })
}

async function usuarioNoExiste(user, done){
  try{
    let users = await UserModel.find().or([{username:user.username}, {email:user.email}]);
    expect(users).toHaveLength(0);
    done();
  }catch (err){
    done(err)
  }
}


describe('Test de integracion para Users', () => {
  
  afterAll(()=>{
    server.close();
    mongoose.disconnect();
  })

  describe('GET /users', () => {
    beforeEach((done)=>{  
      UserModel.deleteMany({}, (err)=>{
        done();
      })
    })

    it('Si no hay usuarios, Deberia Retornar un array vacio', (done)=>{
      request(app)
      .get('/users')
      .end((err, res)=>{
        expect(res.status).toBe(200)
        expect(res.body).toBeInstanceOf(Array)
        expect(res.body).toHaveLength(0)
        done();     
      })
    })

    it('Si existen usuario, deberia retornarlos en un array', (done) => {
      Promise.all(dummyUsers.map(user => new UserModel(user).save()))
        .then(users =>{
          request(app)
          .get('/users')
          .end((err, res)=>{
            expect(res.status).toBe(200)
            expect(res.body).toBeInstanceOf(Array)
            expect(res.body).toHaveLength(3)
            done();     
          })
        })
    });
  });


  describe('POST /users', () => {
    it('Un usuario que cumple con las condiciones deberia ser creado', (done) => {
      request(app)
      .post('/users')
      .send(userNew)
      .end((err, res)=>{
        expect(res.status).toBe(201)
        expect(typeof res.text).toBe('string')
        expect(res.text).toEqual('Usuario creado exitosamente')
        usuarioExisteYAtributosSonCorrectos(userNew, done)
      })
    })

    it('Crear un usuario con username ya registrado deberia fallar', (done) => {
      Promise.all(dummyUsers.map(user => new UserModel(user).save()))
        .then(users =>{
          request(app)
          .post('/users')
          .send({     
            username  : 'jdmarencoporto',
            email     : 'jesus@hotmail.com',
            password  : 'elpassword'
          })
          .end((err, res)=>{
            expect(res.status).toBe(409)
            expect(typeof res.text).toBe('string')
            done();     
          })
        })
    });
    it('Crear un usuario con email ya registrado deberia fallar', (done) => {
      Promise.all(dummyUsers.map(user => new UserModel(user).save()))
        .then(users =>{
          request(app)
          .post('/users')
          .send({     
            username  : 'jdmarencoporto1100',
            email     : 'jesus@hotmail.com',
            password  : 'elpassword'
          })
          .end((err, res)=>{
            expect(res.status).toBe(409)
            expect(typeof res.text).toBe('string')
            done();     
          })
        })
    });
    it('Un usuario sin username no deberia ser creado', (done) => {
      request(app)
      .post('/users')
      .send({     
        email     : 'jesus@hotmail.com',
        password  : 'elpassword'
      })
      .end((err, res)=>{
        expect(res.status).toBe(400)
        expect(typeof res.text).toBe('string')
        done();     
      })  
    });
    it('Un usuario con email invalido no deberia ser creado', (done) => {
      const userEmailErrado = {
        username  : 'lulu',
        email     : 'hotmail.com',
        password  : 'lalulu'
      }
      request(app)
      .post('/users')
      .send(userEmailErrado)
      .end((err, res)=>{
        expect(res.status).toBe(400)
        expect(typeof res.text).toBe('string')
        usuarioNoExiste( userEmailErrado, done )  
      })  
    });
    it('El username y email de un usuario deben ser guardados en lowercase', (done) => {
      const userEmailErrado = {
        username  : 'LUlu',
        email     : 'LULU@HOTmail.coM',
        password  : 'lalulu'
      }
      request(app)
      .post('/users')
      .send(userEmailErrado)
      .end((err, res)=>{
        expect(res.status).toBe(201)
        expect(typeof res.text).toBe('string')
        expect(res.text).toEqual(`Usuario creado exitosamente`)
        usuarioExisteYAtributosSonCorrectos({
          username: userEmailErrado.username.toLowerCase(),
          email: userEmailErrado.email.toLowerCase(),
          password: userEmailErrado.password
        }, done )  
      })  
    });
  })


  describe('Post /users/login', () => {

    it('Login deberia fallar para un usuario que no tiene username', (done) => {
      let bodyLogin = {
        password : '124535879'
      }
      request(app)
        .post('/users/login')
        .send(bodyLogin)
        .end((err, res)=>{
          expect(res.status).toBe(400)
          expect(typeof res.text).toBe('string')
          done()
        })
    });

    it('Login deberia fallar para un usuario que no tiene password', (done) => {
      let bodyLogin = {
        username : 'noexisto',
      }
      request(app)
        .post('/users/login')
        .send(bodyLogin)
        .end((err, res)=>{
          expect(res.status).toBe(400)
          expect(typeof res.text).toBe('string')
          done()
        })
    });

    it('Login deberia fallar para un usuario que no esta registrado', (done) => {
      let bodyLogin = {
        username : 'noexisto',
        password : '124535879'
      }
      request(app)
        .post('/users/login')
        .send(bodyLogin)
        .end((err, res)=>{
          expect(res.status).toBe(400)
          expect(typeof res.text).toBe('string')
          done()
        })
    });

    it('Login deberia fallar para un usuario registrado que suministra una contraseña incorrecta', (done) => {
      let bodyUser = {
        username  : 'lulunew',
        email     : 'lulunew@hotmail.com',
        password  : 'lalulunew'
      }
      new UserModel({
        username  : bodyUser.username,
        email     : bodyUser.email,
        password  : bcrypt.hashSync(bodyUser.password, 10)
      }).save().then(newUser => {
        request(app)
        .post('/users/login')
        .send({
          username  : newUser.username,
          password  : 'password incorrecto'
        })
        .end((err, res)=>{
          expect(res.status).toBe(400)
          expect(typeof res.text).toBe('string')
          done()
        })
      })
      .catch(err =>{
        done(err)
      })
    });

    it('Usuario regstrado debe obtener un JWT token al hacer login con credenciales correctas', (done) => {
      let bodyUser = {
        username  : 'lulunew2',
        email     : 'lulunew2@hotmail.com',
        password  : 'lalulunew2'
      }
      new UserModel({
        username  : bodyUser.username,
        email     : bodyUser.email,
        password  : bcrypt.hashSync(bodyUser.password, 10)
      }).save().then(newUser => {
        request(app)
        .post('/users/login')
        .send({
          username  : newUser.username,
          password  : 'lalulunew2'
        })
        .end((err, res)=>{
          expect(res.status).toBe(200)
          expect(res.body.token).toEqual(jwt.sign({id:newUser._id}, config.jwt.secreto, {expiresIn: config.jwt.tiempoExpiracion}))
          done()
        })
      })
      .catch(err =>{
        done(err)
      })
    });

    it('Al hacer login no debe importar la capitalizacion del username', (done) => {
      let bodyUser = {
        username  : 'lulunew3',
        email     : 'lulunew3@hotmail.com',
        password  : 'lalulunew3'
      }
      new UserModel({
        username  : bodyUser.username,
        email     : bodyUser.email,
        password  : bcrypt.hashSync(bodyUser.password, 10)
      }).save().then(newUser => {
        request(app)
        .post('/users/login')
        .send({
          username  : 'LuluNew3',
          password  : 'lalulunew3'
        })
        .end((err, res)=>{
          expect(res.status).toBe(200)
          expect(res.body.token).toEqual(jwt.sign({id:newUser._id}, config.jwt.secreto, {expiresIn: config.jwt.tiempoExpiracion}))
          done()
        })
      })
      .catch(err =>{
        done(err)
      })
    });
  });
});


