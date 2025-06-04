import { Hono } from 'hono';
import { swaggerUI } from '@hono/swagger-ui';
import { readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

const docs = new Hono();

// Загружаем OpenAPI спецификацию
const loadOpenAPISpec = () => {
  try {
    const yamlPath = join(process.cwd(), 'docs', 'openapi.yaml');
    const yamlContent = readFileSync(yamlPath, 'utf8');
    return yaml.load(yamlContent);
  } catch (error) {
    console.error('Failed to load OpenAPI spec:', error);
    return {
      openapi: '3.0.3',
      info: {
        title: 'NovaPost API',
        version: '1.1.0',
        description: 'OpenAPI specification not found'
      },
      paths: {}
    };
  }
};

// Swagger UI endpoint
docs.get('/swagger', swaggerUI({
  url: '/api/v1/docs/openapi.json'
}));

// OpenAPI JSON endpoint
docs.get('/openapi.json', (c) => {
  const spec = loadOpenAPISpec();
  return c.json(spec);
});

// Редирект с корня документации на Swagger UI
docs.get('/', (c) => {
  return c.redirect('/api/v1/docs/swagger');
});

// Альтернативный endpoint для YAML спецификации
docs.get('/openapi.yaml', (c) => {
  try {
    const yamlPath = join(process.cwd(), 'docs', 'openapi.yaml');
    const yamlContent = readFileSync(yamlPath, 'utf8');
    return c.text(yamlContent, 200, {
      'Content-Type': 'application/x-yaml'
    });
  } catch (error) {
    return c.json({ error: 'OpenAPI YAML not found' }, 404);
  }
});

export default docs; 