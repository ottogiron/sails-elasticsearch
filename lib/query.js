var _ = require('lodash');

var Query = module.exports = function( options){
  this.options = options;
};


Query.prototype.getSortArray = function(){

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




Query.prototype.getElasticDSLQuery = function(){
  var query;
  var where = this.options.where;
  if(isKeyPair(where)){
    query = parseSimpleDSL(where);
  }
  return query;
};

function parseSimpleDSL(where){

 var terms = _.map(where, function(value, key){
   var termFilter = { term: {}};
    termFilter.term[key] = value
    return termFilter;
  });
  var body = {
    query: {
      filtered: {
        filter: {
          and : terms
        }
      }
    }
  };
  return body;
};

function addQueryFilter(query, terms){

}

function addAggregationObject(aggregations, aggregationName, terms){
  var aggregationObject = aggregations[aggregationName] = {};

  if(terms){
    aggregationObject['terms'] = terms;
  }
}



function isKeyPair(where){
  var regExp = /{"[a-z]+":"[a-z]+"(,"[a-z]+":"[a-z]+")*}/i;
  var whereStr = removeSpaces(JSON.stringify(where));
  return regExp.test(whereStr);
}



function removeSpaces(str){
  return str.replace(/ /g,'');
}
