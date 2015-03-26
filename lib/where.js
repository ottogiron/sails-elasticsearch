var _ = require('lodash');

var Where = module.exports = function(where){
  this.where = where;
};

var filterDefinitions = {};

filterDefinitions['term'] = {
  term: {}
};

filterDefinitions['match'] = {
  match: {

  }
};

filterDefinitions['ids'] = {
  ids: {

  }
}

filterDefinitions['and'] = {
  and: []
}

filterDefinitions['or'] = {
  or: []
}

function getFilterDefinition(key) {
  return _.cloneDeep(filterDefinitions[key]);
}


Where.prototype.getFilters = function() {

  var filters = [];
  for(var predicatekey in this.where){
    if(this.where.hasOwnProperty(predicatekey)){
      var value = this.where[predicatekey];
      var parsedPredicate = parsePredicate(predicatekey, value);
      filters.push(parsedPredicate.parsed);
    }
  }
  return filters;

};


function parsePredicate(key, value) {

  var result = {};
  if(isKeyPair(key, value)) {
    result.parsed = parseKeyPair(key, value)
    result.isKeyPair = true;
  }
  else if(isOperator(key)) {
    result.parsed = parseOperator(key, value);
    result.isOperator = true;
  }
  else if(isNested(key, value)){
    result.parsed = parseNested(key, value);
    result.isNested = true;
  }
  return result;
}

function parseNested(key, value) {
  var options = {};
  var filter;

  if(value['<'] || value['lessThan']){
    var operator = value['<'] ? '<' : value['lessThan'];
    options.lt = value[operator];
    filter = getRangeFilter(key, options);
  }
  else if(value['<='] || value['lessThanOrEqual']){
    var operator = value['<='] ? '<=': 'lessThanOrEqual';
    options.lte = value[operator];
    filter = getRangeFilter(key, options);
  }
  else if(value['>'] || value['greaterThan']){
    var operator = value['>'] ? '>': 'greaterThan';
    options.gte = value[operator];
    filter = getRangeFilter(key, options);
  }
  else if(value['>='] || value['greaterThanOrEqual']){
    var operator = value['>='] ? '>=': 'greaterThanOrEqual';
    filter = getRangeFilter(key, options);
  }
  else if(value['!'] || value['not']){
    var operator = value['!'] ? '!': 'not';
    var value = value[operator];
    filter = getNotFilter(key, value);
  }
  else if(value['contains']){
    filter = getMatchFilter(key, value['contains']);
  }
  //TODO: like, startsWith, endsWith

  return filter;
}

function getMatchFilter(key, value) {
  var matchFilterDefinition = getFilterDefinition('match');
  var keyObject = matchFilterDefinition['match'][key] = {};
  keyObject.query = value;
  keyObject.operator = 'and';
  return matchFilterDefinition;
}

function getIdsFilter(key, value) {

  var idsFilterDefinition = getFilterDefinition('ids');
  var idsObject = idsFilterDefinition['ids'];
  idsObject.values = value;
  return idsFilterDefinition;
}


function getNotFilter(key, value) {
  var matchDefinition = getMatchFilter(key, value);
  var notDef = {
    not: matchDefinition
  }

  return matchDefinition;
}



function getRangeFilter(key, options) {
  var rangeDef = {
    "range": {
    }
  };
  var keyObject = rangeDef['range'][key] = {};
  Object.keys(options).forEach(function(option){
    keyObject[option] = options[option];
  });
  return rangeDef;
}

function parseOperator(key, value) {

  var opFilterDef = getFilterDefinition('or');
  _.forEach(value, function(pair) {
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

function parseKeyPair(key, value) {

  var termDef;
  if(Array.isArray(value)) {
    termDef = getIdsFilter(key, value);
  }
  else {
    termDef = getMatchFilter(key, value);
  }


  return termDef;
}

function isOperator(key) {
  var operators = {or:true, and: true, not:true};
  return operators[key] === true;

}


function isKeyPair(key, value) {
  var result = false;
  if(!isOperator(key)){
    return !(value instanceof Object) && !(value instanceof Array);
  }
  return false;
}

function isNested(key, value){
  return !isOperator(key) && value instanceof Object
}
