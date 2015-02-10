/*global module,define,require */
/*jshint
 camelcase: false
 */

var fs = require( "fs" );
module.exports = function ( grunt ) {

	var cfg = {};

	// projectConfig
	cfg['projectConfig'] = require('./grunt-config.js')( grunt );;

    // parse all configured tasks automatically:
    fs.readdirSync( "./" ).forEach( function ( file ) {
        if ( file.indexOf( "Gruntfile." ) === 0 && file !== "Gruntfile.js" ) {
            var name = file.split( "Gruntfile." )[1].split( ".js" )[0];
            cfg[name] = require( "./Gruntfile." + name )( grunt );
        }
    } );
    grunt.initConfig( cfg );



	grunt.registerTask('default', 'dev');
	grunt.registerTask('dev', [
		'clean:empty_dist',
		'copy:to_dist',
		'copy:to_dist_basicfiles',
		'cleanempty'
		]);
	grunt.registerTask('release', [
		'clean:empty_dist',
		'copy:to_dist',
		'cleanempty',
		'compress:release',
		'compress:release_latest'
		]);

};