// av-ui/src/mocks/data.js: TESTS AND DEVELOPMENT ONLY. Fake data shaped like the backend's response DTOs.
// Fake values only (example.test, obviously fake names). Server-decided values are set here as the
// BACKEND would return them; UI code never works them out.
(function () {
  'use strict';

  // PLACEHOLDER resource: replace with the real DTOs from av-service/src/main/java/.../api/. Never invent a field.
  function fakeRecord(overrides) {
    return angular.extend({
      id: 'rec-0001',              // VERIFY: id format the backend returns
      reference: 'REF-TEST-0001',
      name: 'Test Person',
      email: 'test.person@example.test',
      createdAt: '2026-01-01T09:00:00Z'
    }, overrides || {});
  }

  angular.module('mockData', []).constant('mockData', {
    fakeRecord: fakeRecord,
    fakeRecords: function (n) {
      var list = [];
      for (var i = 1; i <= n; i++) {
        list.push(fakeRecord({ id: 'rec-000' + i, reference: 'REF-TEST-000' + i }));
      }
      return list;
    }
  });
})();
