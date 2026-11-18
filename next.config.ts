import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // Não deixa o `next dev` gerar AGENTS.md no projeto.
  agentRules: false,
  async headers() {
    return [
      {
        // O service worker precisa ser revalidado a cada visita para que
        // atualizações do app cheguem ao celular.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default config;
