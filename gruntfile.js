module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    connect: {
      server: {
        options: {
          port: 8000,
          base: ['app', 'build'],
          middleware: function(connect, options) {
            var middle = [];

            middle.push(require('grunt-connect-proxy/lib/utils').proxyRequest);

            options.base.forEach(function(base) {
              middle.push(connect.static(base));
            });

            return middle;
          }
        },
        proxies: [{
          context: '/geoserver/',
          host: 'localhost',
          port: 8080
        }]
      },
    },
    clean: {
      build: ['build']
    },
    copy: {
      deps: {
        files: [{
          expand: true,
          cwd: 'bower_components/jquery/dist',
          src: ['*.js', '*.map'],
          dest: 'build/js'
        },{
          expand: true,
          cwd: 'bower_components/bootstrap/dist',
          src: ['**/*'],
          dest: 'build'
        }, {
          expand: true,
          cwd: 'bower_components/d3',
          src: ['*.js'],
          dest: 'build/js'
        }, {
          expand: true,
          cwd: 'bower_components/nvd3',
          src: ['*.js'],
          dest: 'build/js'
        }, {
          expand: true,
          cwd: 'bower_components/nvd3',
          src: ['*.css'],
          dest: 'build/css'
        }, {
          expand: true,
          cwd: 'vendor/',
          src: ['*.js'],
          dest: 'build/js'
        }, {
          expand: true,
          cwd: 'vendor/',
          src: ['*.css'],
          dest: 'build/css'
        }]
      },
      app: {

      }
    },

    watch: {
    }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-connect-proxy');

  grunt.registerTask('serve', 
    ['clean', 'copy', 'configureProxies:server', 'connect', 'watch']);

};
