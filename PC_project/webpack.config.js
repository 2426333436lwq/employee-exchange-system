const path = require('path');
const webpack = require('webpack');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/main.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'build.js'
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)(\?\S*)?$/,
        type: 'asset/resource'
      }
    ]
  },
  plugins: [
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({
      template: './index.html',
      filename: 'index.html'
    }),
    // 后台数据源配置：api = 调用后端（改动对前台生效）/ local = 本地 mock 副本
    new webpack.DefinePlugin({
      'process.env.PC_DATA_SOURCE': JSON.stringify(process.env.PC_DATA_SOURCE || 'api'),
      'process.env.PC_API_BASE': JSON.stringify(process.env.PC_API_BASE || 'http://localhost:3000/api')
    })
  ],
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
      // 前后台共享的领域契约与展示映射（唯一来源）
      '@shared': path.resolve(__dirname, '../shared')
    }
  },
  devServer: {
    static: {
      directory: path.join(__dirname, './')
    },
    port: 8082,
    historyApiFallback: true,
    hot: true
  }
};