import { defineConfig } from 'orval';

export default defineConfig({
  egs: {
    input: './backend_openapi.json',
    output: {
      target: './src/api/generated/client.ts',
      client: 'fetch',
      schemas: './src/types/api.generated.ts',
      override: {
        fetch: {
          includeHttpResponseReturnType: false,
        },
      },
    },
  },
});