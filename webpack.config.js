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
  experiments: {
    syncWebAssembly: true,
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
              postcssOptions: {
                plugins: [
                  require('postcss-import'),
                  require('tailwindcss'),
                  require('@fullhuman/postcss-purgecss')({
                    content: ['./index.html'],
                  }),
                ],
              },
            },
          },
        ],
      },
    ],
  },
};
