import withPWA from "next-pwa"

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
}

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
})(nextConfig)
