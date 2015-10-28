'use strict';

let EventEmitter = require('events').EventEmitter;

const NotSupportError = ((method) => {throw new Error(`The current ${method} wasn't supportted by abstract class.`)});

//support CRUD opetions for one database
class DbAdapter extends EventEmitter
{
    constructor()
    {
        super();
    }

    create(name, body, callback)
    {
        let that = this;

        let Model = that.getModel(name);
        let $model = new Model(body);
        let $schema = $model.__schema;

        //get wrapper and convert to entity
        let wrapper = that.getWrapper(name);
        if (wrapper && wrapper.to) $model = wrapper.to($model);

        let autoIncrement = ($schema.options && $schema.options.autoIncrement)
                        ? $schema.options.autoIncrement
                        : undefined;


        let createFunc = () => {
            that.createPromise(
                    name,
                    (wrapper && wrapper.from) ? wrapper.from : undefined,
                    (model, resolver) => that._create(model, resolver)
                )
        }

        let pending = (model, func) => {
            func()
                .then(data => that.invokeResolve(Primose.resolve(data), callback))
                .catch(err => that._checkDuplication(err)
                                ? that._increaseValue(model, autoIncrement, pending, func)
                                : that.invokeResolve(Primose.reject(err), callback)
                            )

        }

        return pending(model, createFunc);
    }

    _create(name, model, resolver)
    {
        model.save(resolver);
    }

    _checkDuplication(err)
    {
        return (err.code == 11000) ? true : false;
    }

    _increaseValue(model, autoIncrement, pending, func)
    {
        let field = (autoIncrement.field) ? autoIncrement.field : undefined;
        if (!field) return Promise.reject(new Error('Can find auto increment field.'));

        let filter = JSON.parse(`{"$query": {}, "$orderby": {"${field}": -1}}`);
        let projection = JSON.parse(`{"${field}": 1, "_id": 0}`);

        return new Promise((resolve, reject) => {

            model.findOne(filter, projection)
                .exec((err, data) => {

                    if (err) reject(err);
                    else {
                        //get variants for auto increment
                        let start = (autoIncrement.startValue) ? autoIncrement.startValue : 0;
                        let step = (autoIncrement.step) ? autoIncrement.step : 1;

                        //change auto increment value in model
                        model[field] = (data) ? data[field] + step : start;

                        return pending(model, func());
                    }
                })
        });
    }

    count(name, filter, callback)
    {
        let that = this;
        return that.retrieve(name, fitler, {"countOnly": true}, callback);
    }

    retrieve(name, filter, options, callback)
    {
        let that = this;
        let wrapper = that.getWrapper(name);

        return that.invokeResolve(
                    that.createPromise(
                        name,
                        (wrapper && wrapper.from) ? wrapper.from : undefined,
                        (model, resolver) => {

                            if (!options) options = {};

                            //get method name from options
                            let method = (options["method"]) ? options["method"] : 'find';

                            //check method
                            if (!model[method] || typeof(model[method]) !== 'function') {
                                throw new Error(`Can't find method: ${method}`);
                            }

                            if (!options.filter) options.filter = filter;

                            //invoke method with options
                            that._retrieve(model, method, resolver, options);
                        }
                    ),
                    callback);
    }

    _retrieve(model, method, resolver, options)
    {
        NotSupportError('_retrieve');
    }

    update(name, filter, modifier, callback)
    {
        let that = this;
        let wrapper = that.getWrapper(name);

        return that.invokeResolve(
                    that.createPromise(
                        name,
                        (wrapper && wrapper.from) ? wrapper.from : undefined,
                        (model, resolver) => {
                            let modifiedKey = Object.keys(modifier);

                            if (wrapper && wrapper.to) {
                                wrapper.to(model, modifiedKey);
                            }

                            that._update(model, resolver, filter, modifier);
                        }
                    ),
                    callback);
    }

    _update(model, resolver, filter, modifier)
    {
        model.update(filter, modifier, resolver);
    }

    delete(name, filter, callback)
    {
        let that = this;

        return that.invokeResolve(
                    that.createPromise(
                        name,
                        null,
                        (model, resolver) => that._delete(model, resolver, filter)
                    ),
                    callback);
    }

    _delete(model, resolver, filter)
    {
        model.remove(filter, resolver)
    }

    createPromise(name, wrapper, callback)
    {
        //reassign
        let that = this;

        //get instance of model by name
        let model = that.getModel(name);

        return new Promise((resolve, reject) => {

            callback(model, (err, data) => {

                //reject error
                if (err) reject(err);

                //wrapper data
                if (wrapper) data = wrapper(data);

                //resolve data
                return resolve(data);
            })
        });
    }

    invokeResolve(promise, callback)
    {
        return promise
                .then(data => (callback) ? callback(null, data) : data)
                .catch(err => {
                    if (callback) callback(err, null);
                    throw err;
                });
    }

    createModel(name)
    {
        NotSupportError('createModel');
    }

    getModel(name)
    {
        NotSupportError('getModel');
    }

    getSchema(name)
    {
        NotSupportError('getSchema');
    }

    getWrapper(name)
    {
        return {"from": null, "to": null};
    }
}

module.exports = DbAdapter;
