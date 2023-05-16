/** @type {import('next').NextConfig} */

const next_production = process.env.NODE_ENV === "production";

const next_configuration = {
	// reactStrictMode: true,
	compiler: (next_production) && {
		removeConsole: {exclude: ["error"]}
	},
	env: {
		server_url: (next_production) ? "https://backend.runtimecloud.com/tankon" : "http://localhost:3001"
	},
	productionBrowserSourceMaps: true,
	poweredByHeader: false
};

module.exports = next_configuration;
