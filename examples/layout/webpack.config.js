module.exports = {
  mode: 'development',

  devtool: 'eval-source-map',

  entry: {
    app: './app.ts'
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: [/node_modules/],
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [['@babel/env', {
                targets: ['>2%'],
              }]]
            }
          },
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json']
  }
};