'use strict'

const fs = require('fs')
const path = require('path')
const ss = require('./script.js')
const aq = require('../promise/aq.js')

//eval
class Parser
{
  constructor() {
      //super()
  }

  static parse(scriptPath)
  {
    const parser = new Parser()
    return parser.parseFile(scriptPath)
  }

  parseFile(scriptPath, callback) {

    const that = this

    return (
      aq.readFile( scriptPath, {encoding: 'utf-8'} )
        .then( data => aq.Q(that.parseContent(data)) )
        .then( script => (callback) ? callback(null, script) : script )
        .catch( err => {
                    if (callback) callback(err, null)
                    else throw err
                })
    )
  }

  parseFileSync(scriptPath) {

    //read content from script file
    const content = fs.readFileSync( scriptPath, {encoding: 'utf-8'} )

    return this.parseContent(content)
  }

  parseContent(content) {

    const that = this

    const args = {}

    //parse script by content
    const sc = (() => {
        try{
            return ( eval("(function (){return " + content + "})()") )
        }
        catch(err){
            throw new Error('Can\'t parse invaild script, please check it again')
        }
    })()

    const $sc = new ss.Script()

    if (sc) {

      //parse metas
      $sc.version = (sc.version) ? sc.version : "1.0.0"
      $sc.hash = (sc.hash) ? sc.hash : $sc.generateHash(content)
      $sc.action = (sc.action) ? sc.action : ss.DefaultAction

      //parse cache policy
      if (sc.cache) {
        $sc.cache = sc.cache
      }

      //parse arguments in script
      $sc.arguments = (!sc.arguments)
                        ? []
                        : Object.keys(sc.arguments)
                            .map( key => that.parseArgument(key, sc.arguments[key]) )

      //parse parts in script
      if (sc.parts) {

        if (Array.isArray(sc.parts)) {
          sc.parts.forEach( part => that.parsePart($sc, $sc.parts, part) )
        }
        else that.parsePart($sc, $sc.parts, sc.parts)
      }

      //parse script-scope function
      if (sc.before) $sc.before = sc.before
      if (sc.after) $sc.after = sc.after
    }

    return $sc
  }

  parseArgument(key, arg) {
    const $arg = new ss.Argument()

    $arg.name = key
    $arg.type = (arg.type) ? arg.type : ((arg) ? arg : "string")
    $arg.default = (arg.default) ? arg.default : undefined

    return $arg
  }

  parsePart(owner, parent, part)
  {
    const that = this
    const $part = new ss.Part()

    $part._id = (part.id) ? part.id : ''
    $part.hash = (part.hash) ? part.hash : owner.generateHash(JSON.stringify(part))
    $part.action = (part.action) ? part.action : ((owner.action) ? owner.action : ss.DefaultAction)

    //parse cache policy
    if (part.cache) {
      $part.cache = part.cache
    }

    if (part.headers) {
      $part.headers = part.headers
    }

    //parse body
    if (part.body) $part.body = part.body

    //parse children parts if it exists.
    if (part.parts) {
      if (Array.isArray(part.parts)) {

        part.parts
          .forEach( part => that.parsePart(owner, $part.Parts, part) )
      }
      else that.parsePart(owner, $part.Parts, part.parts)
    }

    //parse functions in part scope
    if (part.before) $part.before = part.before
    if (part.beforePost) $part.beforePost = part.beforePost
    if (part.after) $part.after = part.after

    if (parent && Array.isArray(parent)) parent.push($part)
  }
}

module.exports = Parser
