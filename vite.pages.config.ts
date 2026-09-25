import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/taylor-metal-purchasing-portal-/",
  plugins: [react()],
  build: { outDir: "pages-dist", emptyOutDir: true },
});
