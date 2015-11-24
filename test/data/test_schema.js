
'use strict'

const path = require('path')
const data = require('../../').data

//const Cache = data.SchemaCache

const cache = data.SchemaCache.create()

let file = undefined

file = path.join(__dirname, '../data/schemas/blog.json')
cache.add(file)

file = path.join(__dirname, '../data/schemas/blog.js')
cache.add(file)

const schemas = cache.getSchemas('mongo')
console.log(schemas)

//console.log(cache.Test)
