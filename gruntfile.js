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

};
