var generator = require('lucene-query-generator');
var _ = require('lodash');

var Query = module.exports = function( options){
  this.options = options;
};

Query.prototype.getSortArray = function(){

  var sort = this.options.sort || {};
  var sortArray = _.map(sort, function(value, key){
     if(!isNaN(value)){
       if(value >= 1){
         value = 'ASC';
       }
       else{
         value = 'DESC';
       }
     }
     return key + ":" + value;

  });
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
