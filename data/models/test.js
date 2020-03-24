const ROOT = require('./root')

class Model extends ROOT{
    
    constructor(){
        super()
        this.tableName="test"
    }
}

module.exports = new Model()