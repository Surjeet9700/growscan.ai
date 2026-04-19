import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = {
  // Allow ngrok and local network access to Next.js dev HMR
  allowedDevOrigins: [
    "10.58.156.88",
    "*.ngrok-free.app",
    "*.ngrok.io",
  ],
  // Silence root lockfile warning
  outputFileTracingRoot: process.cwd(),
};

export default withPWA(nextConfig);
