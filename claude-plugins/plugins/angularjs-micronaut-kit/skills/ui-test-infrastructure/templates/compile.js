// av-ui/test/helpers/compile.js: compile a component with a scenario for a test.
// Loaded by Karma after angular-mocks and before the specs. Call it once per spec (`it`): it creates the injector.
(function () {
  'use strict';

  window.compileComponent = function (html, options) {
    options = options || {};
    var scenario = options.scenario || 'success';
    var result = {};

    angular.mock.module('app');            // VERIFY: the application module name
    angular.mock.module('mockScenarios');

    angular.mock.inject(['$compile', '$rootScope', '$httpBackend', 'mockScenarios', 'mockData',
      function ($compile, $rootScope, $httpBackend, mockScenarios, mockData) {
        mockScenarios[scenario]($httpBackend, mockData);
        var scope = $rootScope.$new();
        angular.extend(scope, options.bindings || {});
        var element = $compile(html)(scope);
        document.body.appendChild(element[0]); // attached, so focus and axe behave as in a browser
        scope.$digest();

        result.element = element;
        result.scope = scope;
        result.$httpBackend = $httpBackend;
        result.flush = function () { $httpBackend.flush(); };
      }]);

    return result;
  };

  afterEach(function () {
    // Every component test cleans up the DOM it attached.
    Array.prototype.slice.call(document.body.children).forEach(function (child) {
      if (child.tagName !== 'SCRIPT') document.body.removeChild(child);
    });
  });
})();
