/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ||
      "https://cot-app-backend-k6sxnnfksq-uc.a.run.app",
    // process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", // Default to localhost if undefined
  },
};

// process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", // Default to localhost if undefined

export default nextConfig;
