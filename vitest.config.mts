import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * Configuração mínima do Vitest: resolve o alias "@" para `src`, permitindo
 * testar código de aplicação/rota que usa o alias do projeto (tsconfig paths).
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
