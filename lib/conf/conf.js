'use strict';

let jsYaml = require('js-yaml');

const SysKeyOfVersion = "$$version";
const SysKeyOfDescription = "$$description";

class ConfigMap extends Map
{
    constructor(...values)
    {
        super(...values);

        this.version = '1.0.0';
        this.description = '';
        this.Settings = {};
    }

    get Version() {return this.version;}
    get Description() {return this.description;}

    toObject(outputSys) {

        return JSON.parse(this.toJSON(outputSys));
    }

    toJSON(outputSys) {

        let output = {};

        if (outputSys) {
            output[SysKeyOfVersion] = this.version;
            output[SysKeyOfDescription] = this.description;
        }

        if (this.size > 0){

            (function fn(o, dict) {

                for(let item of o) {

                    let k = item[0], v = item[1];
                    dict[k] = (v instanceof Map) ? fn(v, {}) : v;
                }

                return dict;
            })(this, output);
        }

        return JSON.stringify(output, null, 4);
    }

    copy(map) {
        this.clear();
        this.merge(map);
    }

    merge(map) {
        if (map.Version) this.version = map.Version;
        if (map.Description) this.description = map.Description;

        if (map.size > 0){

            (function fn(clonedMap, map) {

                for(let key of clonedMap.keys()) {

                    let item = clonedMap.get(key);

                    if (item instanceof Map) {
                        let newMap = new Map();
                        fn(item, newMap);
                        map.set(key, newMap);
                    }
                    else map.set(key, item);
                }

                return map;
            })(map, this);
        }
    }

    clone() {
        let cfm = new ConfigMap();

        cfm.copy(this);

        return cfm;
    }

    static parseMap(map) {
        //create new instance of ConfigMap
        let cf = new ConfigMap()

        //copy data from map
        cf.copy(map);

        //convert cf to JSON and parse it.
        return ConfigMap.parseJSON(cf.toJSON(true));
    }

    static parseYAML(yaml) {
        return ConfigMap.parse(jsYaml.safeLoad(yaml));
    }

    static parseJSON(json) {
        return ConfigMap.parse(JSON.parse(json));
    }

    static parse(options) {

        let cMap = new ConfigMap();

        //convert object to map object
        (function parseKeys(o, map) {

            //create new instance of Map if the arg doesn't exist
            if (!map) map = new Map();

            //fetch all key in object
            Object.keys(o).forEach(function(key) {

                //ingore comment or system key
                if (key.startsWith('#') || key.startsWith('$$')) return;

                //get value by key
                let value = o[key];

                if (Array.isArray(value)){

                    for(let i = 0; i < value.length; i++) {
                        if (typeof value[i] === 'object')
                            value[i] = parseKeys(values[i]);
                    }

                    map.set(key, value);
                    return;
                }
                else if (typeof value === 'object') {
                    //create new map for object value
                    map.set(key, parseKeys(value));
                    return;
                }

                if (typeof value === 'string') {

                    //allow use ${expression} to define a expression and apply it in runtime
                    if (value.startsWith('${') && value.endsWith('}')) {

                        //convert express to value
                        value = eval(value.substring(2, value.length - 1));
                    }
                }

                map.set(key, value);    //set value by current key
            })

            //return created map
            return map;
        })(options, cMap)

        //append system varints
        if (options[SysKeyOfVersion] !== undefined) cMap.version = options[SysKeyOfVersion];
        if (options[SysKeyOfDescription] !== undefined) cMap.description = options[SysKeyOfDescription];

        let settings = options['settings'] || {};

        Object.keys(settings)
            .forEach(function(key){

            cMap.Settings[key] = settings[key];
        })

        return cMap;
    }
}

module.exports = ConfigMap;
