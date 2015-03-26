var _ = require('lodash');
var Where = require('./where');


var Query = module.exports = function( options){
  this.options = options;
};


Query.prototype.getElasticDSLQuery = function(isJoin) {
  var query;
  var where = this.options.where;
  query = parseSimpleDSL(where, isJoin);
  return query;
};

function parseSimpleDSL(where, isJoin) {
 var where = new Where(where);
 var filters = where.getFilters(isJoin);

 var terms = _.map(where, function(value, key){
   var termFilter = { term: {}};
    termFilter.term[key] = value
    return termFilter;
  });


//TODO: switch between terms and matches
  var body = {
    query: {
      filtered: {
        query:  {
          bool : {
            must: filters
          }
        }
        // filter: {
        //   bool : {
        //     must: filters
        //   }
        // }
      }
    }
  };
  return body;
};

Query.prototype.getSortArray = function() {

  var sort = this.options.sort || {};
  var sortArray = _.map(sort, function(value, key){
     if(!isNaN(value)){
       if(value >= 1){
         value = 'asc';
       }
       else{
         value = 'desc';
       }
     }
     var sortItem = {};
     sortItem[key] = value;

  });
  return sortArray;
}


function addAggregationObject(aggregations, aggregationName, terms) {
  var aggregationObject = aggregations[aggregationName] = {};

  if(terms){
    aggregationObject['terms'] = terms;
  }
}




function removeSpaces(str) {
  return str.replace(/ /g,'');
}
