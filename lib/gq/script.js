'use strict'

const crypto = require('crypto')

const EntryMethod = '__main__'
const DefaultAction = "default"

class Script
{
  constructor() {
    this._version = ''
    this._hash = ''
    this._arguments = []
    this._action = ''
    this._parts = new Set()
    this._context = {}
  }

  get Entry() { return EntryMethod }

  get Version() { return this._version }
  set Version(val) { this._version = val }

  get Hash() { return this._hash }
  set Hash(val) { this._hash = val }

  get Action() { return this._action }
  set Action(val) { this._action = val }

  get Context() { return this._context}
  get Arguments() { return this._arguments }

  get Parts() { return this._parts }

  generateHash(data)
  {
    const hashs = ['sha384', 'md5', 'sha256']

    for( let i = 0; i < hashs.length; i++ ) {

      const hash = crypto.createHash(hashs[i])
      hash.update(data)
      data = hash.digest('base64')
    }

    if (data.lastIndexOf('==') == data.length - 2){
      data = data.substring(0, data.length - 2)
    }

    return data
  }
}

class Argument
{
  constructor()
  {
    this._name = ''
    this._type = 'string'
    this._default = undefined
    this._value = undefined
  }

  get Name() { return this._name }
  set Name(val) { this._name = val }

  get Type() { return this._type }
  set Type(val) { this._type = val }

  get Default() { return this._default }
  set Default(val) { this._default = val }

  get Value() { return this._value }
  set Value(val) { this._value = val }
}

class Part
{
  constructor()
  {
    this._id = ''
    this._hash = ''
    this._action = DefaultAction
    this._headers = new Map()
    this._body = ''

    this._relations = new Set()
    this._parts = new Set()
  }

  get Id() { return this._id }
  set Id(val) { this._id = val }

  get Hash() { return this._hash }
  set Hash(val) { this._hash = val }

  get Action() { return this._action }
  set Action(val) { this._action = val }

  get Body() { return this._body }
  set Body(val) { this._body = val }

  get Headers() { return this._headers }
  get Relations() { return this._relations }
  get Parts() { return this._parts }
}

class Relation
{
  constructor()
  {
    this._target = undefined
    this._action = undefined
    this._joins = new Map()
    this._as = new RelationAs()
  }

  get Target() { return this._target }
  set Target(val) { this._target = val }

  get Action() { return this._action }
  set Action(val) { this._action = val }

  get Joins() { return this._joins }
  get As() { return this._as }
}

class RelationAs
{
  constructor()
  {
    this._name = undefined
    this._fields = new Set()
  }

  get Name() { return this._name }
  set Name(val) { this._name = val }

  get Fields() { return this._fields }
}

module.exports = (function() {
  return {
    "DefaultAction": DefaultAction,
    "Script": Script,
    "Argument": Argument,
    "Part": Part,
    "Relation": Relation,
    "RelationAs": RelationAs
  }
})()
