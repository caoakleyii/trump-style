var webpack = require('webpack');
var path = require('path');
module.exports = {
    entry: path.resolve(__dirname, 'client/app.js'),
    output: {
        path:  path.resolve(__dirname, 'public/scripts'),
        filename: 'bundle.js',
    },
    plugins: [
      new webpack.optimize.UglifyJsPlugin(),
      new webpack.optimize.OccurrenceOrderPlugin(),
      new webpack.optimize.DedupePlugin(),
      new webpack.DefinePlugin({
          'process.env': {
              'NODE_ENV': '"production"'
          },
          'api_domain': '"138.197.16.92"',
          'api_port': '"80"',
          'api_scheme': '"http"'

      }),
      new webpack.ProvidePlugin({
          React: 'react'
      })
    ],
    module: {
        rules: [
          {
              test: /\.jsx?$/,
              exclude: /node_modules/,
              use: ['react-hot-loader/webpack', 'babel-loader']
          },
          {
              test: /\.less$/,
              use: [
                "style-loader",
                "css-loader",
                "less-loader"
              ]
          }
        ]
    }
};
