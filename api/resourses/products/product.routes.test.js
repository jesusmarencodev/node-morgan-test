const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const ProductModel = require('./products.model');
const mongoose = require('mongoose');
const UserModel = require('../users/user.model');
const app = require('../../../index').app;
const server = require('../../../index').server;



let idInexistente = '5ee376dc8de04c08dc387213'

let productoParaDB = {
  title : "piña y aguacate",
  price : 90.12,
  currency : "USD",
  dueno : "jmarenco11",
}
let newProduct = {
  title : "Programacion",
  price : 99.12,
  currency : "USD",
  dueno : "jmarenco11",
}
let productoCasoDelete = {
  title : "este producto sera creado y borrado",
  price : 90.12,
  currency : "USD",
  dueno : "jmarenco110",
}

let productoCasoPut = {
  title : "este producto sera creado y borrado",
  price : 90.12,
  currency : "USD",
  dueno : "jesus",
}

let productoDueño = {
  title : "React",
  price : 99.12,
  currency : "USD",
  dueno : "jesus",
}
let testUser = {
  username  : 'Jesus',
  email     : 'j@j.com',
  password  : '123456'
}
let authToken;
let tokenInvalido = 'MyJhbGciOiJIUzI1NiIsInR5cCI6IkpsVCl9.oykpZCI6IjVlZTIxNjc0ZDg1NzA3MTZmYzI2YzY2ZiIsImlhdCI6MTU5MTg3NTI0NSwiZXhwIjoxNTkxOTYxNjQ1fQ.rkjA3cf8MCIMKQUFGiNqa2dm3vo3CO34sP3cPyrrlqA'

function obtenerToken(done){
  UserModel.deleteMany({}, err =>{
    if(err) done(err);
    request(app)
    .post('/users')
    .send(testUser)
    .end((err, res)=>{
      expect(res.status).toBe(201)
      request(app)
      .post('/users/login')
      .send({
        username: testUser.username,
        password: testUser.password
      })
      .end((err, res)=>{
        expect(res.status).toBe(200)
        authToken = res.body.token
        done()
      })

    })
  })
}


describe('Test de Integracion de Productos', () => {


  beforeEach((done)=>{  
    ProductModel.deleteMany({}, (err)=>{
      done();
    })
  })

  afterAll(async()=>{
    server.close();
    mongoose.disconnect();
  })
  
  describe('GET /products', () => {
    it('Si existen productos debe devolver un array de  productos', (done) => {
      request(app)
      .get('/products')
      .end((err, res)=>{
        expect(res.status).toBe(200)
        expect(res.body.products).toBeInstanceOf(Array)
        done();
      })
    });
    it('Si no existen productos debe devolver un array vacio', (done) => {
      request(app)
      .get('/products')
      .end((err, res)=>{
        expect(res.status).toBe(200)
        expect(res.body.products).toBeInstanceOf(Array)
        expect(res.body.products).toHaveLength(0)
        done();
      })
    });
  });

  describe('GET /products/:id', () => {
    it('Tratar de obtener un producto con ID invalido debe retornar un 400', (done) => {
      request(app)
      .get('/products/123')
      .end((err, res)=>{
        expect(res.status).toBe(400)
        done()
      }) 
    });

    it('Tratar de obtener un producto con ID que no existe deberia retornar un 404', (done) => {
      request(app)
      .get(`/products/${idInexistente}`)
      .end((err, res)=>{
        expect(res.status).toBe(404)
        done()
      }) 
    });

    it('Deberia retornar un producto si existe en la base de datos', (done) => {
      ProductModel(productoParaDB).save()
        .then(producto => {
          request(app)
          .get(`/products/${producto._id}`)
          .end((err, res)=>{
            expect(res.status).toBe(200)
            expect(res.body).toBeInstanceOf(Object)
            expect(res.body.product.title).toEqual(producto.title)
            expect(res.body.product.price).toEqual(producto.price)
            expect(res.body.product.currency).toEqual(producto.currency)
            expect(res.body.product.dueno).toEqual(producto.dueno)
            done()
          })
        })
        .catch(err =>{
          done(err);
        }) 
    });
  });

  describe('POST /products', () => {

    beforeAll(obtenerToken)

    it('Si el usuario provee un token valido y el producto tambien es valido, deberia ser creado', (done) => {
      request(app)
      .post('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send(newProduct)
      .end((err, res)=>{
        expect(res.status).toBe(201)
        done()
      })
    });
    it('Si el usuario no provee un toke valido, deberia retornar 401', (done) => {
      request(app)
      .post('/products')
      .set('Authorization', `Bearer ${tokenInvalido}`)
      .send(newProduct)
      .end((err, res)=>{
        expect(res.status).toBe(401)
        done()
      })
    });
  });

  describe('DELETE /products/:id', () => {

    let idDelProductoExistente
    
    //borramos todos los productos y creamos uno para el caso de prueba
    beforeEach(done =>{
      ProductModel.deleteMany({}, (err)=>{
        if(err) done(err);
        ProductModel(productoCasoDelete).save()
          .then(product =>{
            idDelProductoExistente = product._id;
            done()
          })
      })
    })


    beforeAll(obtenerToken)

    
    it('Al tratar de obtener producto con id invalido deberia retornar un 400', (done)=>{
      request(app)
      .delete(`/products/123`)
      .set('Authorization', `Bearer ${authToken}`)
      .end((err, res)=>{
        expect(res.status).toBe(400)
        done()
      })
    })

    it('Al tratar de obtener producto que no existe deberia retornar 404', (done)=>{
      request(app)
      .delete(`/products/${idInexistente}`)
      .set('Authorization', `Bearer ${authToken}`)
      .end((err, res)=>{
        expect(res.status).toBe(404)
        done()
      })
    })

    it('Si el usuario no proporciona un token de autenticacion valido deberia retornar 401', (done)=>{
      request(app)
      .delete(`/products/${idInexistente}`)
      .set('Authorization', `Bearer ${tokenInvalido}`)
      .end((err, res)=>{
        expect(res.status).toBe(401)
        done()
      })
    })

    it('Si el usuario no es dueño del producto  deberia retornar 401', (done)=>{
      ProductModel(newProduct).save()
        .then(product =>{
          request(app)
          .delete(`/products/${product._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .end((err, res)=>{
            expect(res.status).toBe(401)
            expect(res.body.message.includes('no es dueño del producto, solo puedes procesar productos creados por ti. Request no procesado')).toBe(true)
            done()
          })
        })
        .catch(err =>{
          done(err)
        })
    })

    it('Si el usuario  es dueño del producto y entrega un token valido el producto debe ser borrado, deberia retornar un 200', (done)=>{
      ProductModel(productoDueño).save()
        .then(product =>{
          request(app)
          .delete(`/products/${product._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .end((err, res)=>{
            expect(res.status).toBe(200)
            ProductModel.findOneAndDelete({_id:product._id})
              .then(productDelete =>{
                expect(productDelete).toBe(null)
                done()
              })
              .catch(err=>{
                done(err)
              })
          })
        })
        .catch(err =>{
          done(err)
        })
    })
  });

  describe('PUT /products/:id', () => {
    let idDelProductoExistente
    
    //borramos todos los productos y creamos uno para el caso de prueba
    beforeEach(done =>{
      ProductModel.deleteMany({}, (err)=>{
        if(err) done(err);
        ProductModel(productoCasoDelete).save()
          .then(product =>{
            idDelProductoExistente = product._id;
            done()
          })
      })
    })

    beforeAll(obtenerToken)

    it('Al tratar de obtener producto con id invalido deberia retornar un 400', (done)=>{
      request(app)
      .put(`/products/123`)
      .set('Authorization', `Bearer ${authToken}`)
      .end((err, res)=>{
        expect(res.status).toBe(400)
        done()
      })
    })

    it('Al tratar de obtener producto que no existe deberia retornar 404', (done)=>{
      request(app)
      .put(`/products/${idInexistente}`)
      .send({
        title : "React",
        price : 99.12,
        currency : "USD",
        dueno : "jesus",
      })
      .set('Authorization', `Bearer ${authToken}`)
      .end((err, res)=>{
        expect(res.status).toBe(404)
        done()
      })
    }) 

    it('Si el usuario no proporciona un token de autenticacion valido deberia retornar 401', (done)=>{
      request(app)
      .put(`/products/${idInexistente}`)
      .send({
        title : "React",
        price : 99.12,
        currency : "USD",
        dueno : "jesus",
      })
      .set('Authorization', `Bearer ${tokenInvalido}`)
      .end((err, res)=>{
        expect(res.status).toBe(401)
        done()
      })
    })
    it('Si el usuario no es dueño del producto  deberia retornar 401', (done)=>{
      ProductModel(newProduct).save()
        .then(product =>{
          request(app)
          .put(`/products/${product._id}`)
          .send({
            title : "React5",
            price : 99.12,
            currency : "USD",
            dueno : "jesus",
          })
          .set('Authorization', `Bearer ${authToken}`)
          .end((err, res)=>{
            expect(res.status).toBe(401)
            expect(res.body.message.includes('no es dueño del producto, solo puedes procesar productos creados por ti. Request no procesado')).toBe(true)
            done()
          })
        })
        .catch(err =>{
          done(err)
        })
    })

    it('Si el usuario es dueño del producto y proporciona un token valido el producto debe ser actualizado debe retornar un 200', (done) => {
      ProductModel(productoCasoPut).save()
        .then(product =>{
          request(app)
          .put(`/products/${product._id}`)
          .send({
            title : "React5",
            price : 99.12,
            currency : "USD",
            dueno : "jesus",
          })
          .set('Authorization', `Bearer ${authToken}`)
          .end((err, res)=>{
            expect(res.status).toBe(200)
            done()
          })
        })
        .catch(err=>{
          done(err)
        })
    });
  }); 
});
