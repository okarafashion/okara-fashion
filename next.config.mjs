/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(process.env.STATIC_EXPORT === 'true' ? { output: 'export' } : {}),
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  ...(process.env.NEXT_PUBLIC_BASE_PATH
    ? {
        basePath: process.env.NEXT_PUBLIC_BASE_PATH,
      }
    : {}),
};

export default nextConfig;
