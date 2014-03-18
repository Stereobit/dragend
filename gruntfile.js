module.exports = function (grunt) {

    var istanbul = require('istanbul');

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

        coverage: {

            // when the coverage object is received
            // from grunt-mocha it will be saved here
            coverage: null,

            instrument: {

                // files to NOT instrument eg. libs
                // these files will be copied "as is"
                ignore: [
                    'src/js/lib/**/*'
                ],

                // files to instrument
                files: [
                    {
                        src: 'dragend.js',
                        expand: true,
                        cwd: 'dist',
                        dest: 'test/src'
                    }
                ]
            },

            // task for generating reports
            report: {
                reports: ['html', 'text-summary'],
                dest: 'test/reports'
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

    grunt.event.on('coverage', function (coverage) {
        grunt.config('coverage.coverage', coverage);
    });

    grunt.registerMultiTask('coverage', 'Generates coverage reports for JS using Istanbul', function () {

        if (this.target === 'instrument') {

            var ignore = this.data.ignore || [];
            var instrumenter = new istanbul.Instrumenter();

            this.files.forEach(function (file) {

                var src = file.src[0],
                    instrumented = grunt.file.read(src);

                // only instrument this file if it is not in ignored list
                if (!grunt.file.isMatch(ignore, src)) {
                    instrumented = instrumenter.instrumentSync(instrumented, src);
                }

                // write
                grunt.file.write(file.dest, instrumented);
            });

            return;
        }

        if (this.target === 'report') {

            this.requiresConfig('coverage.coverage');

            var Report = istanbul.Report;
            var Collector = istanbul.Collector;
            var reporters = this.data.reports;
            var dest = this.data.dest;
            var collector = new Collector();

            // fetch the coverage object we saved earlier
            collector.add(grunt.config('coverage.coverage'));

            reporters.forEach(function (reporter) {

                Report.create(reporter, {
                    dir: dest + '/' + reporter
                }).writeReport(collector, true);

            });

            return;
        }

        grunt.warn('Unknown target - valid targets are "instrument" and "report"');
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
        grunt.task.run('coverage:instrument', 'mocha', 'coverage:report');
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