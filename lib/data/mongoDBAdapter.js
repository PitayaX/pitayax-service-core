'use strict';

let mongoose = require('mongoose');
let DbAdapter = require('./dbAdapter.js');

class MongoDBAdapter extends DbAdapter
{
    constructor(connections)
    {
        super();
        this.models = new Map();
        this.connections = connections;
    }

    get Models() { return this.models; }
    get Connections() { return this.connections; }


    _retrieve(model, method, resolver, options)
    {
        //parse options
        let filter = (options.filter) ? options.filter : {};
        let projection = (options && options.projection) ? options.projection : undefined;
        let sort = (options && options.sort) ? options.sort : undefined;
        let pager = (options.page && options.pageSize) ? {"page": options.page, "size": options.pageSize} : undefined;

        if (projection === undefined) projection = (options && options.fields) ? options.fields : undefined;

        //ready for invoking method
        let op = model[method];

        //call method with arguments
        let pending = op.call(model, filter, projection);

        if (method === 'count' || method === 'findOne') {
            //do nothing for count or findOne method
        }
        else {
            //pending sorter
            if (sort) {
                pending = pending.sort();
            }

            //pending pager
            if (pager) {
                pending = pending.skip(pager.size * (pager.page - 1))
                                .limit(pager.size);
            }
        }

        //execute resolver
        return pending.exec(resolver);
    }

    createModel(name)
    {
        let that = this;

        //get schema by entity name
        let schema = that.getSchema(name);
        if (schema == null) throw new Error(`Can't find model by schema: ${name}`);

        //get connection by entity name from pool
        let conn = that.Connections.get(schema.database);
        if (conn == null) throw new Error(`Can't find model by database: ${name}`);

        //get mongo connection from connection
        let mongoConnection = conn.Connection;

        //mongoConnection.name(name, )
        let mongoSchema = mongoose.Schema(schema.model, schema.options || {});
        let modelNames = mongoConnection.modelNames();

        //create mongoose model by name and schema
        let model = mongoConnection.model(name, mongoSchema);

        //append prototypes
        if (model) {
            model.prototype.__name = schema.name;
            model.prototype.__schema = schema;
        }

        return model;
    }

    getModel(name)
    {
        let that = this;

        if (!that.models.has(name)) {
            that.models.set(name, that.createModel(name));
        }

        return that.models.get(name);
    }

    getSchema(name)
    {
        let that = this;

        return (that.Connections.Schemas.has(name))
                ? that.Connections.Schemas.get(name)
                : null;
    }

    getWrapper(name)
    {
        return {"from": null, "to": null};
    }
}

module.exports = MongoDBAdapter;
