// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const useHttps = env.VITE_DEV_HTTPS === "1";

  return {
    plugins: [react()],
    server: {
      https: useHttps
        ? {
            key: fs.readFileSync(new URL("./certs/localhost-key.pem", import.meta.url)),
            cert: fs.readFileSync(new URL("./certs/localhost.pem", import.meta.url)),
          }
        : false,
      host: "localhost",
      port: 5173,
    },
  };
});
