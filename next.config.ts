import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Driver Postgres native dipakai apa adanya di runtime Node, jangan di-bundle.
  serverExternalPackages: ["pg"],
};

export default nextConfig;
