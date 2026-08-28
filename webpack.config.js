const path = require('node:path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const DependencyExtractionWebpackPlugin = require('@wordpress/dependency-extraction-webpack-plugin');
const postcssPlugins = require('@wordpress/postcss-plugins-preset');
const cssnano = require('cssnano');
const rtlcss = require('rtlcss');
const TerserPlugin = require('terser-webpack-plugin');

class RtlCssPlugin {
	apply(compiler) {
		compiler.hooks.thisCompilation.tap('VmfoRtlCssPlugin', (compilation) => {
			compilation.hooks.processAssets.tap(
				{
					name: 'VmfoRtlCssPlugin',
					stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
				},
				(assets) => {
					for (const assetName of Object.keys(assets)) {
						if (!assetName.endsWith('.css') || assetName.endsWith('-rtl.css')) {
							continue;
						}

						const css = assets[assetName].source().toString();
						const rtlName = assetName.replace(/\.css$/, '-rtl.css');
						const rtlSource = rtlcss.process(css);

						compilation.emitAsset(
							rtlName,
							new webpack.sources.RawSource(rtlSource)
						);
					}
				}
			);
		});
	}
}

module.exports = (_env, argv = {}) => {
	const isProduction = argv.mode === 'production';

	return {
		mode: isProduction ? 'production' : 'development',
		target: 'browserslist',
		devtool: isProduction ? false : 'source-map',
		entry: {
			admin: path.resolve(__dirname, 'src/admin/index.js'),
			'admin-wp7': path.resolve(__dirname, 'src/admin/wp7-compat.js'),
			editor: path.resolve(__dirname, 'src/editor/index.js'),
			'editor-wp7': path.resolve(__dirname, 'src/editor/wp7-compat.js'),
			settings: path.resolve(__dirname, 'src/admin/settings.js'),
			shared: path.resolve(__dirname, 'src/shared/index.js'),
		},
		output: {
			filename: '[name].js',
			path: path.resolve(__dirname, 'build'),
			clean: true,
			library: {
				name: ['vmfo', '[name]'],
				type: 'window',
			},
		},
		resolve: {
			alias: {
				'lodash-es': 'lodash',
			},
			extensions: ['.jsx', '.js', '...'],
		},
		module: {
			rules: [
				{
					test: /\.m?jsx?$/,
					exclude: /node_modules/,
					use: {
						loader: require.resolve('babel-loader'),
						options: {
							cacheDirectory: process.env.BABEL_CACHE_DIRECTORY || true,
							babelrc: false,
							configFile: false,
							presets: [require.resolve('@wordpress/babel-preset-default')],
						},
					},
				},
				{
					test: /\.css$/,
					use: [
						MiniCssExtractPlugin.loader,
						{
							loader: require.resolve('css-loader'),
							options: {
								importLoaders: 1,
								sourceMap: !isProduction,
							},
						},
						{
							loader: require.resolve('postcss-loader'),
							options: {
								sourceMap: !isProduction,
								postcssOptions: {
									plugins: isProduction
										? [
											...postcssPlugins,
											cssnano({
												preset: [
													'default',
													{
														discardComments: { removeAll: true },
													},
												],
											}),
										]
										: postcssPlugins,
								},
							},
						},
					],
				},
			],
		},
		optimization: {
			minimize: isProduction,
			minimizer: [
				new TerserPlugin({
					parallel: true,
					terserOptions: {
						output: {
							comments: /translators:/i,
						},
						compress: {
							passes: 2,
						},
						mangle: {
							reserved: ['__', '_n', '_nx', '_x'],
						},
					},
					extractComments: false,
				}),
			],
		},
		externals: {
			'@vmfo/shared': 'vmfo.shared',
		},
		plugins: [
			new webpack.DefinePlugin({
				'globalThis.SCRIPT_DEBUG': JSON.stringify(!isProduction),
				SCRIPT_DEBUG: JSON.stringify(!isProduction),
			}),
			new MiniCssExtractPlugin({ filename: '[name].css' }),
			new DependencyExtractionWebpackPlugin(),
			new RtlCssPlugin(),
		],
		stats: {
			children: false,
		},
	};
};
