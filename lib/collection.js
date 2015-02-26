var _ = require('lodash');

var Collection = module.exports = function(collection){
  this.collection = collection;
};


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
    result._id = hit._id;
    return result;
  });

  return searchResults;
};
