var _ = require('lodash');
var async = require('async');
var Query = require('./query');
var Collection = module.exports = function(conn, collectionName, collectionDefinition){

  this.collectionName = collectionName
  this.conn = conn;
};

Collection.prototype.create = function(data, cb){
  console.log("Processing array", data);
  this._createSingle(data,cb);
};

Collection.prototype.createEach = function(data, cb){
  var self = this;
  if (data.length === 0) {return cb(null, []);}
  async.mapSeries(data, function(item, cb){
    self._createSingle(item, cb)
  }, function(err, results){
    if(err){ return cb(err);}
    cb(null, results);
  });
};

Collection.prototype.find = function(options, cb){
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

      if(err){
        return cb(err);
      }
      var searchResults = Collection.cleanResults(results);
      cb(null, searchResults);
  });
}

Collection.prototype. _createSingle = function _createSigle(data, cb){
  var conn = this.conn;
  conn.client.create({
    index: conn.config.index,
    type: this.collectionName,
    body: data,
  }, function(error, response) {
    if(error) {
      return cb(error);
    }
    else {
      var id = response._id;
      data.id = id;
      cb(null, data);
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
    return result;
  });

  return searchResults;
};
