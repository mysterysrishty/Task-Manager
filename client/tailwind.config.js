/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        taskflow: {
          canvas: "#f6f1e8",
          panel: "#fffaf2",
          ink: "#202637",
          muted: "#6d7483",
          accent: "#1f7a72",
          warm: "#f28f6b",
          line: "#e5d9c7",
        },
      },
      boxShadow: {
        soft: "0 24px 70px rgba(44, 53, 70, 0.12)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
