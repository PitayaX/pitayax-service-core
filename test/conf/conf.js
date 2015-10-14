'use strict';

let assert = require('assert');
let path = require('path');
let fs = require('fs');

let ConfigMap = require('../../').ConfigMap;
let cf = new ConfigMap();

describe("ConfigMap", function() {
    it('Get/set key-value', function() {
        //test set key and get key
        cf.set('key1', 1).set('key2', 'test string');
        assert.equal(cf.get('key1'), 1, 'get key1');
        assert.equal(cf.get('key2'), 'test string', 'get key2');
    });

    it('toJson function', function() {
        //test toJSON function
let cfJSON = `{
    "key1": 1,
    "key2": "test string"
}`
        assert.equal(cf.toJSON(), cfJSON, 'toJSON function');
    });

    it('clone function', function() {
        //test copy function
        let cf2 = cf.clone();
        assert.deepEqual(cf.toObject(), cf2.toObject(), 'clone function');
    });

    it('copy function', function() {

        let m1 = new ConfigMap();
        m1.set('k1', 'v1').set('k2', 'v2');
        let cf3 = new ConfigMap();
        cf3.copy(m1);

        assert.equal(cf3.get('k1'), 'v1', 'copied k1');
        assert.equal(cf3.get('k2'), 'v2', 'copied k2');
    });

    it('check configuration file', function() {
        //get full file path and parse it for JSON format
        let configJSONFile = path.join(__dirname, 'config.json');
        let configFromJSON = ConfigMap.parseJSON(fs.readFileSync(configJSONFile, { encoding: 'utf-8' }));
        //console.log('Parsed JSON file OK.')

        //get full file path and parse it for YAML format
        let configYamlFile = path.join(__dirname, 'config.yml');
        let configFromYaml = ConfigMap.parseYAML(fs.readFileSync(configYamlFile, { encoding: 'utf-8' }));

        let configs = [configFromJSON, configFromYaml];

        configs.forEach(function(config) {

            assert.equal(config.get('name'), 'test file', 'get name from config')

            let databases = config.get('databases');
            if (!databases) throw new assert.AssertionError('get datatabase node');

            assert.equal(databases.has('dbtest'), true, 'got dbtest node');
            assert.equal(databases.has('dbsys'), true, 'got dbsys node');
            assert.notEqual(databases.has('dbuser'), true, 'doesn\'t got dbuser node');
        })

        let configDebugYamlFile = path.join(__dirname, 'config.debug.yml');
        let configDebugFromYaml = ConfigMap.parseYAML(fs.readFileSync(configDebugYamlFile, { encoding: 'utf-8' }));

        configFromYaml.merge(configDebugFromYaml);
        assert.equal(configFromYaml.get('name'), 'debug file', 'get name from config')
        assert.equal(configFromYaml.get('databases').get('dbtest'), 'connection string for test with debug mode', 'get databases.dbtest from config')
        //console.log('Checked configuration file OK');
    });
});
