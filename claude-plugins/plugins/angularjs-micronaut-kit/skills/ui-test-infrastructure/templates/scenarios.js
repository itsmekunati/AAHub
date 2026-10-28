// av-ui/src/mocks/scenarios.js: TESTS AND DEVELOPMENT ONLY. Named outcomes the UI must handle.
// Each scenario registers $httpBackend responses. Paths, fields, status codes and the error shape MUST match
// the controllers and DTOs in av-service/; a scenario never invents one.
(function () {
  'use strict';

  var RECORDS = /\/api\/records(\?.*)?$/; // PLACEHOLDER: replace with real endpoints

  // VERIFY: the error body the backend's exception handler returns for 400, 409 and 500.
  function errorBody(message, fieldErrors) {
    return { message: message, errors: fieldErrors || [] };
  }

  function success($httpBackend, mockData) {
    $httpBackend.whenGET(RECORDS).respond(200, mockData.fakeRecords(3));
    $httpBackend.whenPOST(RECORDS).respond(function (method, url, data) {
      return [201, mockData.fakeRecord(angular.fromJson(data))];
    });
  }

  angular.module('mockScenarios', ['mockData']).constant('mockScenarios', {
    success: success,
    empty: function ($httpBackend) {
      $httpBackend.whenGET(RECORDS).respond(200, []);
    },
    validationError: function ($httpBackend, mockData) {
      $httpBackend.whenGET(RECORDS).respond(200, mockData.fakeRecords(3));
      $httpBackend.whenPOST(RECORDS).respond(400, errorBody('Validation failed', [
        { field: 'email', message: 'Enter an email address in the correct format' } // VERIFY: documented shape
      ]));
    },
    conflict: function ($httpBackend) {
      $httpBackend.whenPOST(RECORDS).respond(409, errorBody('A record with this reference already exists'));
    },
    serverError: function ($httpBackend) {
      $httpBackend.whenGET(RECORDS).respond(500, errorBody('Internal error'));
      $httpBackend.whenPOST(RECORDS).respond(500, errorBody('Internal error'));
    },
    slow: success, // the dev mock backend adds a delay for this one (see mock-backend.module.js)
    offline: function ($httpBackend) {
      // -1 is how $http reports a network failure.
      $httpBackend.whenGET(RECORDS).respond(-1, null);
      $httpBackend.whenPOST(RECORDS).respond(-1, null);
    }
  });
})();
