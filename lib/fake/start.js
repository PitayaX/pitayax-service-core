'use strict'

let faked = require('./http.js')

let port = 1033
let fakedHTTP = new faked(port)
fakedHTTP.start()
