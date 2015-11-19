'use strict'

const adapter = {}
const folders = ['./conf/conf.js', './data/index.js', './fake/index.js', './gq/index.js', './logger/logger.js', './promise/aq.js']

folders
  .forEach( folder => {
    if (folder.startsWith('#')) return
    let lib = require(folder)

    adapter[lib.name] = lib
  })

module.exports = adapter
