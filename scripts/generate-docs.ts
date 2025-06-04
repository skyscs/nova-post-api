#!/usr/bin/env bun

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

const DOCS_DIR = join(process.cwd(), 'docs');
const OUTPUT_DIR = join(DOCS_DIR, 'generated');

// Создаем директорию для генерируемой документации
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

function generateMarkdownDocs() {
  try {
    // Загружаем OpenAPI спецификацию
    const yamlPath = join(DOCS_DIR, 'openapi.yaml');
    const yamlContent = readFileSync(yamlPath, 'utf8');
    const spec: any = yaml.load(yamlContent);

    let markdown = `# ${spec.info.title}\n\n`;
    markdown += `**Version:** ${spec.info.version}\n\n`;
    markdown += `${spec.info.description}\n\n`;

    if (spec.info.contact) {
      markdown += `**Support:** [${spec.info.contact.name}](${spec.info.contact.url})\n\n`;
    }

    if (spec.servers) {
      markdown += `## Servers\n\n`;
      spec.servers.forEach((server: any) => {
        markdown += `- **${server.description}:** \`${server.url}\`\n`;
      });
      markdown += '\n';
    }

    // Группируем endpoints по тегам
    const endpointsByTag: { [key: string]: any[] } = {};
    
    Object.entries(spec.paths).forEach(([path, pathItem]: [string, any]) => {
      Object.entries(pathItem).forEach(([method, operation]: [string, any]) => {
        if (method !== 'parameters') {
          const tag = operation.tags?.[0] || 'other';
          if (!endpointsByTag[tag]) {
            endpointsByTag[tag] = [];
          }
          endpointsByTag[tag].push({
            method: method.toUpperCase(),
            path,
            ...operation
          });
        }
      });
    });

    // Генерируем документацию по тегам
    Object.entries(endpointsByTag).forEach(([tag, endpoints]) => {
      markdown += `## ${tag.charAt(0).toUpperCase() + tag.slice(1)}\n\n`;
      
      endpoints.forEach((endpoint) => {
        markdown += `### ${endpoint.method} ${endpoint.path}\n\n`;
        markdown += `**${endpoint.summary}**\n\n`;
        
        if (endpoint.description) {
          markdown += `${endpoint.description}\n\n`;
        }

        // Параметры
        if (endpoint.parameters && endpoint.parameters.length > 0) {
          markdown += `#### Parameters\n\n`;
          markdown += `| Name | Type | Required | Description |\n`;
          markdown += `|------|------|----------|-------------|\n`;
          
          endpoint.parameters.forEach((param: any) => {
            const required = param.required ? 'Yes' : 'No';
            const type = param.schema?.type || 'string';
            markdown += `| \`${param.name}\` | ${type} | ${required} | ${param.description || ''} |\n`;
          });
          markdown += '\n';
        }

        // Примеры ответов
        if (endpoint.responses) {
          markdown += `#### Responses\n\n`;
          Object.entries(endpoint.responses).forEach(([code, response]: [string, any]) => {
            markdown += `**${code}** - ${response.description}\n\n`;
          });
        }

        markdown += '---\n\n';
      });
    });

    // Схемы данных
    if (spec.components?.schemas) {
      markdown += `## Data Schemas\n\n`;
      Object.entries(spec.components.schemas).forEach(([schemaName, schema]: [string, any]) => {
        markdown += `### ${schemaName}\n\n`;
        if (schema.description) {
          markdown += `${schema.description}\n\n`;
        }
        
        if (schema.properties) {
          markdown += `#### Properties\n\n`;
          markdown += `| Property | Type | Description |\n`;
          markdown += `|----------|------|-------------|\n`;
          
          Object.entries(schema.properties).forEach(([propName, prop]: [string, any]) => {
            const type = prop.type || (prop.allOf ? 'object' : 'unknown');
            markdown += `| \`${propName}\` | ${type} | ${prop.description || ''} |\n`;
          });
          markdown += '\n';
        }
      });
    }

    // Сохраняем Markdown файл
    const markdownPath = join(OUTPUT_DIR, 'api-documentation.md');
    writeFileSync(markdownPath, markdown);
    console.log(`✅ Markdown documentation generated: ${markdownPath}`);

  } catch (error) {
    console.error('❌ Failed to generate markdown documentation:', error);
    process.exit(1);
  }
}

function generateStaticHTML() {
  try {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NovaPost API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui.css" />
    <style>
        html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
        }
        *, *:before, *:after {
            box-sizing: inherit;
        }
        body {
            margin:0;
            background: #fafafa;
        }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: '../openapi.yaml',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout"
            });
        };
    </script>
</body>
</html>`;

    const htmlPath = join(OUTPUT_DIR, 'index.html');
    writeFileSync(htmlPath, html);
    console.log(`✅ Static HTML documentation generated: ${htmlPath}`);
    console.log(`📖 Open in browser: file://${htmlPath}`);

  } catch (error) {
    console.error('❌ Failed to generate static HTML:', error);
    process.exit(1);
  }
}

function main() {
  console.log('🚀 Generating API documentation...');
  
  generateMarkdownDocs();
  generateStaticHTML();
  
  console.log('✨ Documentation generation completed!');
  console.log('');
  console.log('📁 Generated files:');
  console.log(`   - Markdown: docs/generated/api-documentation.md`);
  console.log(`   - HTML: docs/generated/index.html`);
  console.log('');
  console.log('🌐 Online documentation:');
  console.log(`   - Swagger UI: http://localhost:3001/api/v1/docs/swagger`);
  console.log(`   - OpenAPI JSON: http://localhost:3001/api/v1/docs/openapi.json`);
  console.log(`   - OpenAPI YAML: http://localhost:3001/api/v1/docs/openapi.yaml`);
}

if (require.main === module) {
  main();
} 