module.exports = function (grunt) {

    // grunt plugins
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({

        pkg: grunt.file.readJSON("package.json"),

        mocha: {
            test: {
                src: 'test/index.html',
                options: {
                    reporter: 'Spec',
                    run: false,
                    log: true
                }
            }
        },

        test: {
            options: {
                template: 'test/index.template.html',
                runner: 'test/index.html',
                files: 'test/spec/**/*'
            }
        },

        clean: {
            dist: ['dist'],
            tests: [
                'test/src',
                'test/reports',
                'test/index.html'
            ]
        },

        jshint: {
            src: [
                'dragend.js'
            ],
            tests: [
                'test/spec'
            ],
            grunt: [
                'gruntfile.js'
            ]
        },

        uglify: {
            main: {
                files: {
                    'dist/dragend.min.js': ['dist/dragend.js']
                }
            }
        },

        copy:    {
          index:  {
            options: {
              processContent: function (content, srcpath) {
                return grunt.template.process(content);
              }
            },
            src:  'dragend.js',
            dest: 'dist/dragend.js'
          }
        }

    });

    grunt.registerTask('test', 'Run JS Unit tests', function () {

        var options = this.options();

        var tests = grunt.file.expand(options.files).map(function(file) {
            return '../' + file;
        });

        // build the template
        var template = grunt.file.read(options.template)
            .replace('{{ tests }}', JSON.stringify(tests));

        // write template to tests directory and run tests
        grunt.file.write(options.runner, template);

        grunt.task.run('mocha');
    });

    grunt.registerTask('build', 'build release versions', function () {
        grunt.task.run([
            'clean',
            'jshint:grunt',
            'jshint:src',
            'copy',
            'uglify',
            'jshint:tests',
            'test'
        ]);
    });

};
