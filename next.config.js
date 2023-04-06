/** @type {import('next').NextConfig} */

const next_production = process.env.NODE_ENV === "production";

const next_configuration = {
	// reactStrictMode: true,
	compiler: (next_production) && {
		removeConsole: {exclude: ["error"]}
	}
};

module.exports = next_configuration;
