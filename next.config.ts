import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  // Registering PWA requires no extra properties for default usage
});

const nextConfig = {
  // Add backend-specific config here if needed
};

export default withPWA(nextConfig);
