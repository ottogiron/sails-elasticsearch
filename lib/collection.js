var _ = require('lodash');
var async = require('async');
var Query = require('./query');
var Collection = module.exports = function(conn, collectionName, collectionDefinition){

  this.collectionName = collectionName
  this._parseDefinition(collectionDefinition);
  this.conn = conn;
};



Collection.prototype.update = function(options, values, cb) {
  var self = this;
  var updateResults = [];
  this.find(options, function(err, results) {
    if(err){return cb(err);}

    async.map(results, function(toBeUpdated, cb) {
      self.conn.client.update({
        index: self.conn.config.index,
        type: self.collectionName,
        id: toBeUpdated.id,
        refresh: true,
        body: {
          doc: values
        }
      }, function(err, result){
        if(err) {return cb(err);}
        var newResult = _.merge(toBeUpdated, values);
        cb(null, newResult);
      });
    },
    function(err, results) {
      if(err){ return cb(err);}
      cb(null, results);
    })
  });
};


Collection.prototype.create = function(data, cb) {

  this._createSingle(data,cb);
};


Collection.prototype.createEach = function(data, cb) {
  var self = this;
  if (data.length === 0) {return cb(null, []);}
  async.mapSeries(data, function(item, mbm){
    self._createSingle(item, function(err, result) {
      if(err){ return mcb(err);}
      mcb(null, result);
    });
  }, function(err, results){
    if(err){ return cb(err);}
    cb(null, results);
  });
};


Collection.prototype.find = function(options, cb) {

  var conn = this.conn;
  var query = new Query( options);
  conn.client.search({
    index: conn.config.index,
    type: this.collectionName,
    size: options.limit,
    from: options.skip,
    body: query.getElasticDSLQuery(),
    sort: query.getSortArray()

  }, function(err, results) {
    if(err){ return cb(err);}
    var searchResults = Collection.cleanResults(results);
    cb(null, searchResults);
  });
};


Collection.prototype.destroy = function(options, cb) {

  var self = this;
  var conn = this.conn;
  var options = options || {};

  this.find(options, function(err, results) {
    if(err){ return cb(err);}

    async.each(results, function(item, cb) {
      self.destroyById(item.id, cb);

    }, function(err){
      if(err){return cb(err);}
      cb(null, results);
    });

  });
};


Collection.prototype.destroyById = function(id, cb) {
  this.conn.client.delete({
    index: this.conn.config.index,
    type: this.collectionName,
    id: id,
    refresh: true
  }, function(err, result){
    if(err){ return cb(err);}
    cb(null, result)
  });
};


Collection.prototype._createSingle = function _createSigle(data, cb) {
  var conn = this.conn;

  conn.client.create({
    index: conn.config.index,
    refresh: true,
    type: this.collectionName,
    body: data,
  }, function(error, response) {
    if(error) {return cb(error);}
    else {
      var sdata = _.cloneDeep(data);
      var id = response._id;
      sdata.id = id;
      cb(null, sdata);
    }
  });
}

Collection.prototype.getFields = function(){

  var attributes = this.collection._attributes;
  var pfields = [];

  for (var key in attributes) {
    if (attributes.hasOwnProperty(key)) {
      pfields.push(key);

    }
  }

  return pfields;
};

Collection.cleanResults = function(results){
  var hits = results.hits.hits;
  var searchResults = _.map(hits, function(hit){
    var result = hit._source;
    result.id = hit._id;
    result.createdAt = new Date(result.createdAt);
    result.updatedAt = new Date(result.updatedAt);
    return result;
  });

  return searchResults;
};


/**
 * Get name of primary key field for this collection
 *
 * @return {String}
 * @api private
 */
Collection.prototype._getPK = function _getPK () {
  var self = this;
  var pk;

  _.keys(this.schema).forEach(function(key) {
    if(self.schema[key].primaryKey) pk = key;
  });

  if(!pk) pk = 'id';
  return pk;
};

Collection.prototype._parseDefinition = function _parseDefinition(definition) {
  var self = this,
      collectionDef = _.cloneDeep(definition);

  // Hold the Schema
  this.schema = collectionDef.definition;

  if (_.has(this.schema, 'id') && this.schema.id.primaryKey && this.schema.id.type === 'integer') {
    this.schema.id.type = 'objectid';
  }

  // Remove any Auto-Increment Keys, Mongo currently doesn't handle this well without
  // creating additional collection for keeping track of the increment values
  Object.keys(this.schema).forEach(function(key) {
    if(self.schema[key].autoIncrement) delete self.schema[key].autoIncrement;
  });

  // Replace any foreign key value types with ObjectId
  Object.keys(this.schema).forEach(function(key) {
    if(self.schema[key].foreignKey) {
      self.schema[key].type = 'objectid';
    }
  });

  // Set the identity
	var ident = definition.tableName ? definition.tableName : definition.identity.toLowerCase();
	this.identity = _.clone(ident);
};
