var _ = require('lodash');

var Where = module.exports = function(where){
  this.where = where;
};

var filterDefinitions = {};

filterDefinitions['term'] = {
  term: {}
};

filterDefinitions['match'] = {
  match: {}
};

filterDefinitions['and'] = {
  and: []
}

filterDefinitions['or'] = {
  or: []
}




Where.prototype.getFilters = function(){
  console.log('Where is in this form', this.where);
  var filters = [];
  for(var predicatekey in this.where){
    if(this.where.hasOwnProperty(predicatekey)){
      var value = this.where[predicatekey];
      var parsedPredicate = parsePredicate(predicatekey, value);
      console.log("key is:", predicatekey, 'value is:', value);
      console.log("parsed predicate is:", parsedPredicate.parsed);
      filters.push(parsedPredicate.parsed);
    }
  }
  return filters;
};



function parsePredicate(key, value){
  var result = {};

  if(isKeyPair(key, value)) {
    result.parsed = parseKeyPair(key, value)
    result.isKeyPair = true;
  }
  else if(isOperator(key)) {
    result.parsed = parseOperator(key, value);
    result.isOperator = true;
  }
  return result;
}

function parseOperator(key, value){

  var opFilterDef = _.cloneDeep(filterDefinitions['or']);
  _.forEach(value, function(pair){
    var predicate;
    for(var pairKey in pair){
      if(pair.hasOwnProperty(pairKey)){
         var pairValue = pair[pairKey];
         predicate =  parsePredicate(pairKey, pairValue);
      }
    }

    opFilterDef[key].push(predicate.parsed);

  });

  return opFilterDef;
}

function parseKeyPair(key, value){
  var termDef = _.cloneDeep(filterDefinitions['match']);
  termDef['match'][key] = value;
  return termDef;
}

function isOperator(key){
  var operators = {or:true, and: true, not:true};
  return operators[key] === true;

}


function isKeyPair(key, value){
  var result = false;
  if(!isOperator(key)){
    return !(value instanceof Object) && !Array.isArray(value);
  }
  return false;
}
