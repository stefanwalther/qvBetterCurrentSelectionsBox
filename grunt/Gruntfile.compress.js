/*global module*/
module.exports = function ( grunt ) {
    'use strict';

    grunt.loadNpmTasks('grunt-contrib-compress');
    return {
        release: {
            options: {
                archive: '../build/BetterCurrentSelectionsBox_v<%=projectConfig.extensionVersion%>.zip'
            },
            files: [
                {
                    expand: true,
                    cwd: '../dist/',
                    src: ['**'],
                    dest: '../build/'
                }
            ]
        }
    };
};