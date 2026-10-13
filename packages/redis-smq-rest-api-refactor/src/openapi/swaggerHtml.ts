/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Builds the HTML page that hosts Swagger UI.
 *
 * Pure function: given the same URLs, it produces the same string. No
 * filesystem reads, no template engine, no external HTML dependency.
 * The template is inline because it is small, static, and consumed by
 * exactly one caller (`serveSwagger`).
 *
 * ## Parameter contract
 *
 * Both arguments must be absolute paths beginning with `/`. They are
 * interpolated verbatim into the HTML — no escaping, no normalization.
 * The caller (`serveSwagger`) is responsible for composing them via
 * `joinUrl`, which guarantees that contract.
 *
 * ## Why no `<script>` sanitization
 *
 * The arguments are not user input. They are computed at server
 * bootstrap from `basePath` (validated by `parseConfig` to be a
 * slash-prefixed string) and constant filenames. There is no path by
 * which an attacker influences these values, so there is nothing to
 * escape.
 *
 * If a future change allows a user-supplied `basePath` that isn't
 * validated — for example, if the CLI's `--base-path` flag accepts
 * arbitrary strings — this function must be revisited. Until then, the
 * invariant holds and the HTML stays simple.
 *
 * ## Why the Swagger UI version is not pinned here
 *
 * `swagger-ui-bundle.js` and `swagger-ui-standalone-preset.js` are
 * served from the installed `swagger-ui-dist` package. Which version
 * that is, is decided by `package.json`, not by this file. Swagger UI
 * is forward-compatible across the 5.x line for the options used here
 * (`url`, `dom_id`, `deepLinking`, `presets`, `layout`), so there is no
 * need to add a version suffix to the script paths.
 *
 * @param specUrl - Absolute URL path to the generated OpenAPI document,
 *                  e.g. `/swagger/assets/openapi-specs.json`.
 * @param assetsBasePath - Absolute URL path to the Swagger UI asset
 *                         directory, e.g. `/swagger/ui`.
 */
export function buildSwaggerHtml(
  specUrl: string,
  assetsBasePath: string,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>RedisSMQ REST API • Swagger UI</title>
  <link rel="icon" type="image/png" sizes="32x32" href="${assetsBasePath}/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="${assetsBasePath}/favicon-16x16.png" />
  <link rel="stylesheet" href="${assetsBasePath}/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow-y: scroll; }
    *, *::before, *::after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${assetsBasePath}/swagger-ui-bundle.js" crossorigin></script>
  <script src="${assetsBasePath}/swagger-ui-standalone-preset.js" crossorigin></script>
  <script>
    window.onload = function () {
      window.ui = SwaggerUIBundle({
        url: "${specUrl}",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "StandaloneLayout",
        tryItOutEnabled: true,
        displayRequestDuration: true,
        persistAuthorization: true
      });
    };
  </script>
</body>
</html>`;
}
