var webpack = require('webpack');
var path = require('path');
var outputPath = path.resolve(__dirname, 'build');
outputPath = outputPath.charAt(0).toUpperCase() + outputPath.slice(1);

module.exports = {
    entry: [
      'react-hot-loader/patch',
      'webpack-dev-server/client?http://localhost:8080',
      path.join(__dirname, 'client', 'app.js'),
    ],
    output: {
        path:  path.resolve(__dirname, 'public/scripts'),
        filename: 'bundle.js',
    },
    devServer : {
      hot: true,
      contentBase: 'public/scripts',
      port: 8080,
      https: false,
      historyApiFallback: true,
      proxy: {
        '/api' : {
          target: 'https://localhost:44314',
          secure: false
        }
      }
    },
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
      new webpack.ProvidePlugin({
          React: 'react'
      }),
      new webpack.DefinePlugin({
        'process.env': {
            'NODE_ENV': '"DEBUG"'
        },
        // servicesApi: JSON.stringify('https://localhost:44314')
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
