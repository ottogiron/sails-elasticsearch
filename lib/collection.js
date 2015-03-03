var _ = require('lodash');
var async = require('async');
var Query = require('./query');
var Collection = module.exports = function(conn, collectionName, collectionDefinition){

  this.collectionName = collectionName
  this.conn = conn;
};

Collection.prototype.create = function(data, cb){

  this._createSingle(data,cb);
};

Collection.prototype.createEach = function(data, cb){
  var self = this;
  if (data.length === 0) {return cb(null, []);}
  async.mapSeries(data, function(item, mbm){
    self._createSingle(item, function(err, result){
      if(err){ return mcb(err);}
      mcb(null, result);
    });
  }, function(err, results){
    if(err){ return cb(err);}
    cb(null, results);
  });
};

Collection.prototype.find = function(options, cb){

  console.log('Tyring to look for ...............', options);
  var conn = this.conn;
  var query = new Query( options);
  conn.client.search({
    index: conn.config.index,
    type: this.collectionName,
    size: options.limit,
    from: options.skip,
    body: query.getElasticDSLQuery(),
    sort: query.getSortArray()

  }, function(err, results) {if(err){
        return cb(err);
      }
      var searchResults = Collection.cleanResults(results);
      cb(null, searchResults);
  });
};


Collection.prototype.destroy = function(options, cb){
  var query = new Query(options);
  var self = this;
  var conn = this.conn;
  var options = options || {};

  this.find(options, function(err, results){
    if(err){ return cb(err);}

    async.each(results, function(item, cb){
      self.destroyById(item.id, cb);

    }, function(err){
      if(err){return cb(err);}
      cb(null, results);
    });

  });
};

Collection.prototype.destroyById = function(id, cb){
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

Collection.prototype._createSingle = function _createSigle(data, cb){
  var conn = this.conn;

  conn.client.create({
    index: conn.config.index,
    refresh: true,
    type: this.collectionName,
    body: data,
  }, function(error, response) {
    if(error) {
      return cb(error);
    }
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
