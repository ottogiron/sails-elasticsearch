/**
 * Module Dependencies
 */

var Connection = require('./connection');
var _ = require('lodash');
var Collection = require('./collection');


/**
 * Sails ElasticSeach Adapter
 *
 */
module.exports = (function () {


  // You'll want to maintain a reference to each collection
  // (aka model) that gets registered with this adapter.
  var _modelReferences = {};

  var connections = {};

  // You may also want to store additional, private data
  // per-collection (esp. if your data store uses persistent
  // connections).
  //
  // Keep in mind that models can be configured to use different databases
  // within the same app, at the same time.
  //
  // i.e. if you're writing a MariaDB adapter, you should be aware that one
  // model might be configured as `host="localhost"` and another might be using
  // `host="foo.com"` at the same time.  Same thing goes for user, database,
  // password, or any other config.
  //
  // You don't have to support this feature right off the bat in your
  // adapter, but it ought to get done eventually.
  //
  // Sounds annoying to deal with...
  // ...but it's not bad.  In each method, acquire a connection using the config
  // for the current model (looking it up from `_modelReferences`), establish
  // a connection, then tear it down before calling your method's callback.
  // Finally, as an optimization, you might use a db pool for each distinct
  // connection configuration, partioning pools for each separate configuration
  // for your adapter (i.e. worst case scenario is a pool for each model, best case
  // scenario is one single single pool.)  For many databases, any change to
  // host OR database OR user OR password = separate pool.
  var _dbPools = {};



  var adapter = {

    // Set to true if this adapter supports (or requires) things like data types, validations, keys, etc.
    // If true, the schema for models using this adapter will be automatically synced when the server starts.
    // Not terribly relevant if your data store is not SQL/schemaful.
    syncable: false,


    // Default configuration for collections
    // (same effect as if these properties were included at the top level of the model definitions)
    defaults: {

      host: 'localhost:9200',
      index: 'sails-elasticsearch',
      // If setting syncable, you should consider the migrate option,
      // which allows you to set how the sync will be performed.
      // It can be overridden globally in an app (config/adapters.js)
      // and on a per-model basis.
      //
      // IMPORTANT:
      // `migrate` is not a production data migration solution!
      // In production, always use `migrate: safe`
      //
      // drop   => Drop schema and data, then recreate it
      // alter  => Drop/add columns as necessary.
      // safe   => Don't change anything (good for production DBs)
      migrate: 'alter'
    },



      /**
     * Register A Connection
     *
     * Will open up a new connection using the configuration provided and store the DB
     * object to run commands off of. This creates a new pool for each connection config.
     *
     * @param {Object} connection
     * @param {Object} collections
     * @param {Function} callback
     */
     registerConnection: function(connection, collections, cb) {

       process.nextTick(function(){
      // Keep a reference to this connection
        var cinstance = new Connection(connection);
        connections[connection.identity] = cinstance;

               // Build up a registry of collections
        Object.keys(collections).forEach(function(key) {
          connections[connection.identity].collections[key] = new Collection(connections[connection.identity], key, collections[key]);
        });

        cb();
       });


    },


    /**
     * Fired when a model is unregistered, typically when the server
     * is killed. Useful for tearing-down remaining open connections,
     * etc.
     *
     * @param  {Function} cb [description]
     * @return {[type]}      [description]
     */
    teardown: function(conn, cb) {
      process.nextTick(cb);
    },



    /**
     *
     * REQUIRED method if integrating with a schemaful
     * (SQL-ish) database.
     *
     * @param  {[type]}   collectionName [description]
     * @param  {[type]}   definition     [description]
     * @param  {Function} cb             [description]
     * @return {[type]}                  [description]
     */
    define: function(connectionName, collectionName, definition, cb) {

      // If you need to access your private data for this collection:
      var collection = _modelReferences[collectionName];
      // Define a new "table" or "collection" schema in the data store
      process.nextTick(cb);
    },

    /**
     *
     * REQUIRED method if integrating with a schemaful
     * (SQL-ish) database.
     *
     * @param  {[type]}   collectionName [description]
     * @param  {Function} cb             [description]
     * @return {[type]}                  [description]
     */
    describe: function(connectionName, collectionName, cb) {
      // If you need to access your private data for this collection:
      var collection = _modelReferences[collectionName];
      // Respond with the schema (attributes) for a collection or table in the data store
      var attributes = {};
      process.nextTick(function(){
          cb(null, false);
      });

    },


    /**
     *
     *
     * REQUIRED method if integrating with a schemaful
     * (SQL-ish) database.
     *
     * @param  {[type]}   collectionName [description]
     * @param  {[type]}   relations      [description]
     * @param  {Function} cb             [description]
     * @return {[type]}                  [description]
     */
    drop: function(connectionName, collectionName, relations, cb) {
      // If you need to access your private data for this collection:
      var collection = _modelReferences[collectionName];

      // Drop a "table" or "collection" schema from the data store
      process.nextTick(cb);
    },




    // OVERRIDES NOT CURRENTLY FULLY SUPPORTED FOR:
    //
    // alter: function (collectionName, changes, cb) {},
    // addAttribute: function(collectionName, attrName, attrDef, cb) {},
    // removeAttribute: function(collectionName, attrName, attrDef, cb) {},
    // alterAttribute: function(collectionName, attrName, attrDef, cb) {},
    // addIndex: function(indexName, options, cb) {},
    // removeIndex: function(indexName, options, cb) {},



    /**
     *
     * REQUIRED method if users expect to call Model.find(), Model.findOne(),
     * or related.
     *
     * You should implement this method to respond with an array of instances.
     * Waterline core will take care of supporting all the other different
     * find methods/usages.
     *
     * @param  {[type]}   collectionName [description]
     * @param  {[type]}   options        [description]
     * @param  {Function} cb             [description]
     * @return {[type]}                  [description]
     */
    find: function(connectionName, collectionName, options, cb) {

      // Options object is normalized for you:
      //
      // options.where
      // options.limit
      // options.skip
      // options.sort

      var conn = connections[connectionName];
      var collection = conn.collections[collectionName];

      collection.find(options,cb);

      // Filter, paginate, and sort records from the datastore.
      // You should end up w/ an array of objects as a result.
      // If no matches were found, this will be an empty array.

      // Respond with an error, or the results.

    },

    /**
     *
     * REQUIRED method if users expect to call Model.create() or any methods
     *
     * @param  {[type]}   collectionName [description]
     * @param  {[type]}   values         [description]
     * @param  {Function} cb             [description]
     * @return {[type]}                  [description]
     */
     create: function(connectionName, collectionName, data, cb) {
       var conn = connections[connectionName];
       var collection = conn.collections[collectionName];
       collection.create(data, cb);
     },
    createEach: function(connectionName, collectionName, data, cb) {
      var conn = connections[connectionName];
      var collection = conn.collections[collectionName];
      collection.createEach(data, cb);
    },
    //

    /**
     *
     *
     * REQUIRED method if users expect to call Model.update()
     *
     * @param  {[type]}   collectionName [description]
     * @param  {[type]}   options        [description]
     * @param  {[type]}   values         [description]
     * @param  {Function} cb             [description]
     * @return {[type]}                  [description]
     */
    update: function(connectionName, collectionName, options, values, cb) {

      // Respond with error or an array of updated records.
      var conn = connections[connectionName];
      var collection = conn.collections[collectionName];
      collection.update(options, values, cb);
    },

    /**
     *
     * REQUIRED method if users expect to call Model.destroy()
     *
     * @param  {[type]}   collectionName [description]
     * @param  {[type]}   options        [description]
     * @param  {Function} cb             [description]
     * @return {[type]}                  [description]
     */
    destroy: function(connectionName, collectionName, options, cb) {

      // If you need to access your private data for this collection:
      var collection = _modelReferences[collectionName];


      // 1. Filter, paginate, and sort records from the datastore.
      //    You should end up w/ an array of objects as a result.
      //    If no matches were found, this will be an empty array.
      //
      // 2. Destroy all result records.
      //
      // (do both in a single query if you can-- it's faster)

      // Return an error, otherwise it's declared a success.

      var conn = connections[connectionName];
      var collection = conn.collections[collectionName];
      collection.destroy(options, cb);

    },
    identity: 'sails-elasticsearch'
  };


  // Expose adapter definition
  return adapter;

})();
