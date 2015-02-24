var generator = require('lucene-query-generator');
var _ = require('lodash');

var Query = module.exports = function( options){
  this.options = options;
};

Query.prototype.getLuceneQuery = function(){
  var operands = [];

  var where = this.options.where;
  for(var key in where){
    if(where.hasOwnProperty(key)){
      var nOperand = {};
      nOperand[key] = where[key];
      operands.push(nOperand);
    }
  }

  var query = generator.convert({
    $operands: operands
  });
  return query;

}
