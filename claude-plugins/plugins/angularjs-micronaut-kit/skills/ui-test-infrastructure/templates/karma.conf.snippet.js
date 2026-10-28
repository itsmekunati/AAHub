// av-ui/karma.conf.js: starting point. VERIFY plugin names and the file list against your build.
module.exports = function (config) {
  config.set({
    frameworks: ['jasmine'],
    browsers: ['ChromeHeadless'],
    singleRun: true,
    files: [
      'node_modules/angular/angular.js',
      'node_modules/angular-route/angular-route.js',   // VERIFY: or angular-ui-router
      'node_modules/angular-mocks/angular-mocks.js',   // same version as angular
      'node_modules/axe-core/axe.min.js',
      'src/app/app.module.js',                         // modules first, then everything else
      'src/app/**/*.module.js',
      'src/app/**/*.js',
      'src/mocks/data.js',
      'src/mocks/scenarios.js',
      'test/helpers/*.js',
      'src/app/**/*.spec.js',
      { pattern: 'src/app/**/*.html', included: false } // VERIFY: or preload templates with ng-html2js
    ],
    exclude: ['src/mocks/mock-backend.module.js'],
    reporters: ['progress'],
    failOnEmptyTestSuite: true
  });
};
