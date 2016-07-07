module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        uglify: {
            options: {
                mangle: false,
                sourceMap: false
            },
            paginator: {
                files: {
                    'dist/js/nittro-paginator.min.js': [
                        'src/js/Nittro/Widgets/Paginator.js'
                    ]
                }
            }
        },

        concat: {
            options: {
                separator: ";\n"
            },
            paginator: {
                files: {
                    'dist/js/nittro-paginator.js': [
                        'src/js/Nittro/Widgets/Paginator.js'
                    ]
                }
            }
        },

        less: {
            min: {
                options: {
                    compress: true
                },
                files: {
                    'dist/css/nittro-paginator.min.css': [
                        'src/css/paginator.less'
                    ]
                }
            },
            full: {
                options: {
                    compress: false
                },
                files: {
                    'dist/css/nittro-paginator.css': [
                        'src/css/paginator.less'
                    ]
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-less');

    grunt.registerTask('default', ['uglify', 'concat', 'less']);

};
