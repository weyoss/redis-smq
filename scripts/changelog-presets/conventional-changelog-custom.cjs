/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

const config = require('conventional-changelog-conventionalcommits');
const handlebars = require('handlebars');

module.exports = config({
  types: [
    { type: 'feat', section: '✨ Features' },
    { type: 'fix', section: '🐛 Bug Fixes' },
    { type: 'chore', section: '🚀 Chore', hidden: false },
    { type: 'docs', section: '📝 Documentation' },
    { type: 'style', section: '💄 Styles' },
    { type: 'refactor', section: '♻️ Code Refactoring' },
    { type: 'perf', section: '⚡ Performance Improvements' },
    { type: 'test', section: '✅ Tests', hidden: false },
    { type: 'revert', section: '⏪ Revert', hidden: false },
    { type: 'build', section: '📦 Build System' },
    { type: 'ci', section: '👷 Continuous Integration' },
  ],
  issuePrefixes: ['#'],
  issueUrlFormat: '{{host}}/{{owner}}/{{repository}}/issues/{{id}}',
  commitUrlFormat: '{{host}}/{{owner}}/{{repository}}/commit/{{hash}}',
  compareUrlFormat:
    '{{host}}/{{owner}}/{{repository}}/compare/{{previousTag}}...{{currentTag}}',
  userUrlFormat: '{{host}}/{{user}}',
}).then((preset) => {
  // Register a custom Handlebars helper so we can safely check
  // whether the version is a stable release (does NOT contain "-").
  // This avoids the parse error you saw with `.includes()` inside {{#if}}.
  handlebars.registerHelper('isStableVersion', function (version) {
    return version && !version.includes('-');
  });

  // Override only the header to inject consolidated release-notes link
  // (keeps all default grouping, emojis, etc. from conventionalcommits)
  preset.conventionalChangelog.writerOpts.headerPartial = `## {{#if @root.linkCompare~}}
  [{{version}}]({{~@root.host}}/{{#if this.owner}}{{~this.owner}}{{else}}{{~@root.owner}}{{/if}}/{{#if this.repository}}{{~this.repository}}{{else}}{{~@root.repository}}{{/if}}/compare/{{previousTag}}...{{currentTag}})
{{~else}}{{~version}}{{~/if}}
{{~#if title}} "{{title}}"{{~/if}}
{{~#if date}} ({{date}}){{/if}}

{{#if (isStableVersion version)}}
> 📖 **Detailed Release Notes**: [RedisSMQ v{{version}}](https://github.com/weyoss/redis-smq/blob/master/release-notes/release-v{{version}}.md)
{{/if}}`;

  return preset;
});
