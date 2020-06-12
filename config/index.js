let ambiente = process.env.NODE_ENV || 'development';
let configuracionBase = {
    jwt:{},
    puerto: 3000,
    suprimirLogs : false
}

let configuracionAmbiente = {}




switch(ambiente){
  case "desarrollo":
  case "dev":
  case "development":
    configuracionAmbiente = require("./dev");
    break;
  case "produccion":
  case "prod":
    configuracionAmbiente = require("./prod");     

    break;
  case "test":
    configuracionAmbiente = require("./test");
    break;        
   default:
    configuracionAmbiente = require("./dev"); 
}

module.exports = {
    ...configuracionBase,
    ...configuracionAmbiente
}