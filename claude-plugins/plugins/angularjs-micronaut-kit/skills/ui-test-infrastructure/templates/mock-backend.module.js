// av-ui/src/mocks/mock-backend.module.js: DEVELOPMENT SERVER ONLY.
// Load this file, angular-mocks, data.js and scenarios.js, and add 'mockBackend' to the app's dependencies,
// only when the development-only mock flag is set, so none of it is ever part of a production build.
// VERIFY: how your build includes files conditionally (separate dev index.html, a bundler define, or a gulp task).
(function () {
  'use strict';

  angular.module('mockBackend', ['ngMockE2E', 'mockScenarios'])
    .run(['$httpBackend', '$location', 'mockScenarios', 'mockData', function ($httpBackend, $location, mockScenarios, mockData) {
      var name = $location.search().scenario || 'success';
      var scenario = mockScenarios[name] || mockScenarios.success;
      scenario($httpBackend, mockData);

      // Anything not mocked (templates, static files) passes through to the dev server.
      $httpBackend.whenGET(/\.html$/).passThrough();
    }]);

  // Delay every mocked response for the 'slow' scenario, so loading states can be checked by hand.
  angular.module('mockBackend').config(['$provide', function ($provide) {
    $provide.decorator('$httpBackend', ['$delegate', '$timeout', '$location', function ($delegate, $timeout, $location) {
      if ($location.search().scenario !== 'slow') return $delegate;
      var proxy = function (method, url, data, callback, headers) {
        var slowCallback = function () {
          var args = arguments;
          $timeout(function () { callback.apply(null, args); }, 5000);
        };
        return $delegate.call(this, method, url, data, slowCallback, headers);
      };
      angular.extend(proxy, $delegate);
      return proxy;
    }]);
  }]);
})();
