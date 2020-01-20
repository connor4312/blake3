const path = require('path');

module.exports = {
  mode: process.env.ENV || 'development',
  entry: path.join(__dirname, 'src', 'index.js'),
  watch: process.env.ENV === 'development',
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'dist'),
    publicPath: './dist/',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: loader => [
                require('postcss-import')({ root: loader.resourcePath }),
                require('tailwindcss'),
                require('@fullhuman/postcss-purgecss')({
                  content: ['./index.html'],
                }),
              ],
            },
          },
        ],
      },
    ],
  },
};
