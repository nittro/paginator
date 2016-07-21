module.exports = function(grunt) {

    var files = [
        'src/js/Nittro/Extras/Paginator/Paginator.js',
        'src/js/Nittro/Extras/Paginator/Bridges/PaginatorDI.js'
    ];

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        uglify: {
            options: {
                mangle: false,
                sourceMap: false
            },
            paginator: {
                files: {
                    'dist/js/nittro-extras-paginator.min.js': files
                }
            }
        },

        concat: {
            options: {
                separator: ";\n"
            },
            paginator: {
                files: {
                    'dist/js/nittro-extras-paginator.js': files
                }
            }
        },

        less: {
            min: {
                options: {
                    compress: true
                },
                files: {
                    'dist/css/nittro-extras-paginator.min.css': [
                        'src/css/paginator.less'
                    ]
                }
            },
            full: {
                options: {
                    compress: false
                },
                files: {
                    'dist/css/nittro-extras-paginator.css': [
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
