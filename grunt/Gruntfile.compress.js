/*global module*/
module.exports = function ( grunt ) {
    'use strict';

    grunt.loadNpmTasks('grunt-contrib-compress');
    return {
        release: {
            options: {
                archive: '../build/BetterCurrentSelectionsBox_v<%=projectConfig.extensionVersion%>.qar',
                mode: 'zip'
            },
            files: [
                {
                    expand: true,
                    cwd: '../dist/',
                    src: ['**'],
                    dest: '../build/'
                }
            ]
        },
        release_latest: {
            options: {
                archive: '../build/BetterCurrentSelectionsBox_latest.qar',
                mode: 'zip'
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