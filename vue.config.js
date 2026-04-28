const { resolve } = require("path");
module.exports = {
  publicPath: '/',
  outputDir: 'dist',
  assetsDir: 'static',
  lintOnSave: false,
  productionSourceMap: false,
  transpileDependencies: [],
  devServer: {
    port: 8080,
    open: true
  },
  configureWebpack: {
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    }
  }
}
