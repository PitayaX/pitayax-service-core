'use strict'

let script = require('./script.js')

module.exports = {
    "name": "gq",
    "Script": script.Script,
    "Argument": script.Argument,
    "Part": script.Part,
    "Parser": require('./parser.js'),
    "Engine": require('./engine.js')
}
