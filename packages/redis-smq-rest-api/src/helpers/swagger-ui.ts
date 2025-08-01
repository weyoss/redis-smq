/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export function buildSwaggerUiHtml(specUrl: string, assetsBasePath: string) {
  // assetsBasePath should point to the mounted swagger-ui-dist directory (e.g., <basePath>/docs/assets)
  // specUrl should point to the generated OpenAPI JSON served under <basePath>/assets/<filename>
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>RedisSMQ REST API • Swagger UI</title>
  <link rel="icon" type="image/png" href="${assetsBasePath}/favicon-32x32.png" sizes="32x32" />
  <link rel="icon" type="image/png" href="${assetsBasePath}/favicon-16x16.png" sizes="16x16" />
  <link rel="stylesheet" href="${assetsBasePath}/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${assetsBasePath}/swagger-ui-bundle.js"></script>
  <script src="${assetsBasePath}/swagger-ui-standalone-preset.js"></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: "${specUrl}",
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIStandalonePreset
      ],
      layout: "StandaloneLayout"
    });
  </script>
</body>
</html>`;
}
