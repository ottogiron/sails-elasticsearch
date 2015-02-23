var elasticsearch = require('elasticsearch');


var Connection = module.exports = function(config){
   var self = this;

   // Hold the config object
   this.config = config || {};
   self.client = this._buildConnection();

};

Connection.prototype._buildConnection = function _buildConnection(){
  var client = new elasticsearch.Client({
    host: this.config.host,
    log: 'trace'
  });

  client.ping({
    requestTimeout: 1000,
    hello: "elasticsearch!"
    }, function(error) {
    if (error) {
      console.log('An error has occurred when trying to connect to Elastic Search');
      throw error;
    }
    else {
      console.log('Connection established to Elastic Search at: ' + path);
    }
  });
  return client;
};
