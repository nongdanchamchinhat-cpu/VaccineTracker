import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        accent: "#0f766e",
        sand: "#f8fafc",
        slateWarm: "#334155",
      },
      boxShadow: {
        soft: "0 20px 45px -30px rgba(15, 23, 42, 0.55)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
