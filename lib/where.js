var _ = require('lodash');

var Where = module.exports = function(where){
  this.where = where;
};

var filterDefinitions = {};

filterDefinitions['term'] = {
  term: {}
};

filterDefinitions['match'] = {
  query : {
    match: {}
  }
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
  for(var optionkey in this.where){
    if(this.where.hasOwnProperty(optionkey)){
      var value = this.where[optionkey];
      var parsedOption = parseOption(optionkey, value);
      console.log("key is:", optionkey, 'value is:', value);
      console.log("parsed option is:", parsedOption.parsed);
      filters.push(parsedOption.parsed);
    }
  }
  return filters;
};



function parseOption(key, value){
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
    var option;
    for(var pairKey in pair){
      if(pair.hasOwnProperty(pairKey)){
         var pairValue = pair[pairKey];
         option =  parseOption(pairKey, pairValue);
      }
    }

    opFilterDef[key].push(option.parsed);

  });

  return opFilterDef;
}

function parseKeyPair(key, value){
  var termDef = _.cloneDeep(filterDefinitions['term']);
  termDef['term'][key] = value;
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
