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
      $sc.Version = (sc.version) ? sc.version : "1.0.0"
      $sc.Hash = (sc.hash) ? sc.hash : $sc.generateHash(content)
      $sc.Action = (sc.action) ? sc.action : ss.DefaultAction

      //parse cache policy
      if (sc.cache) { $sc.Cache = sc.cache }

      //parse arguments in script
      $sc._arguments = (!sc.arguments)
                        ? []
                        : Object.keys(sc.arguments)
                            .map( key => that.parseArgument(key, sc.arguments[key]) )

      //parse parts for script
      that.parseParts($sc, sc, $sc.Parts)

      //parse script-scope function
      if (sc.before) $sc.before = sc.before
      if (sc.after) $sc.after = sc.after
    }

    return $sc
  }

  parseArgument(key, arg)
  {
    const $arg = new ss.Argument()

    $arg._name = key
    $arg._type = (arg.type) ? arg.type : ((arg) ? arg : "string")
    $arg._default = (arg.default) ? arg.default : undefined

    return $arg
  }

  parseParts(owner, parent, parts)
  {
    const that = this
    const $parts = parts

    if (parent.parts)
    {
      ( (Array.isArray(parent.parts)) ? parent.parts : [parent.parts] )
        .forEach( part => that.parsePart(owner, $parts, part) )
    }
  }

  parsePart(owner, parent, part)
  {
    //assign target to that
    const that = this

    //create new instance of part
    const $part = new ss.Part()

    //set identity to part if it was defined
    $part.Id = (part.id) ? part.id : undefined

    //getnerat hash for part if it wasn't defined
    $part.Hash = (part.hash) ? part.hash : owner.generateHash(JSON.stringify(part))

    //get action for current part,
    $part.Action = (part.action) ? part.action : ((owner.action) ? owner.action : ss.DefaultAction)

    //parse cache policy
    if (part.cache)
    {
      $part.Cache = part.cache
    }

    //parse headers
    if (part.headers)
    {
      //parse headers in part
      if (typeof part.headers === 'function')
      {
        //insert entry to headers
        $part.Headers.set(ss.Entry, part.headers)
      }
      else
      {
        Object
          .keys(part.headers)
          .filter( key => key.indexOf('__') < 0)   //ignore system key
          .forEach( key => $part.Headers.set(key, part.headers[key]) )
      }
    }

    //parse body, it only parse in runtime if the body is a function
    if (part.body) $part.Body = part.body

    //parse relation
    that.parseRelations(owner, part, $part.Relations)

    //parse child parts for current part
    that.parseParts(owner, part, $part.Parts)

    //parse functions in part scope
    if (part.before) $part.before = part.before
    if (part.beforePost) $part.beforePost = part.beforePost
    if (part.after) $part.after = part.after

    parent.add($part)   //insert part to parent
  }

  parseRelations(owner, parent, relations)
  {
    const that = this
    const $relations = relations

    if (parent.relations)
    {
      ( (Array.isArray(parent.relations)) ? parent.relations : [parent.relations] )
      .forEach( relation => that.parseRelation(owner, $relations, relation) )
    }
  }

  parseRelation(owner, parent, relation)
  {
    const $relation = new ss.Relation()

    //parse target and action
    $relation.Target = relation.target
    $relation.Action = relation.action

    //parse joins
    if (!relation.joins) throw new Error('Invalid relation without joins')

    Object
      .keys(relation.joins)
      .forEach( key => $relation.Joins.set(key, relation.joins[key]) )

    //parse as name and fields
    if (!relation.as) throw new Error('Invalid relation without as')

    const relationAs = relation.as

    $relation.As.Name = relationAs.name

    if (!relationAs.fields) throw new Error('Invalid relation without as.fields')

    //add fields
    relationAs
      .fields
      .forEach( field => $relation.As.Fields.add(field))

    //add relation to parent
    parent.add($relation)
  }
}

module.exports = Parser
