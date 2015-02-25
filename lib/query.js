var generator = require('lucene-query-generator');
var _ = require('lodash');

var Query = module.exports = function( options){
  this.options = options;
};

Query.prototype.getSortArray = function(){

  var sort = this.options.sort || {};
  console.log('When generation sort', this.options);
  var sortArray = _.map(sort, function(value, key){
     return key + ":" + value;
  });
  console.log('THe sort array is', sortArray);
  return sortArray;
}

Query.prototype.getLuceneQuery = function(){


  var where = this.options.where;
  var operands = _.map(where, function(value, key){
    var nOperand = {};
    nOperand[key] = value;
    return nOperand;
  });
  var query = generator.convert({
    $operands: operands
  });
  return query;

}
