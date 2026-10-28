// av-ui/test/helpers/axe.js: accessibility assertion for Jasmine. axe-core is loaded by Karma.
(function () {
  'use strict';

  window.expectNoAxeViolations = function (element, done) {
    var node = element[0] || element;
    window.axe.run(node, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] })
      .then(function (results) {
        var summary = results.violations.map(function (v) {
          return v.id + ': ' + v.nodes.map(function (n) { return n.target.join(' '); }).join(', ');
        });
        expect(summary).toEqual([]);
        done();
      })
      .catch(done.fail);
  };
})();
