/*global module*/
module.exports = function (grunt) {
    'use strict';

    grunt.loadNpmTasks('grunt-contrib-clean');
    return {

        empty_dist: {
            options: {
                force: true
            },
            src: [
                '../dist/**/*'
            ]
        }
    };
};