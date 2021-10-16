const config = {
  mode: 'development',

  devtool: 'eval-source-map',

  entry: {
    app: './src/app.ts',
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
              presets: [
                [
                  '@babel/env',
                  {
                    targets: ['>2%'],
                  },
                ],
              ],
            },
          },
          {
            loader: 'ts-loader',
          },
        ],
      },
    ],
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },
}

module.exports = (env) => {
  env = env || {}

  if (env.local) {
    config.resolve.alias = {
      'msagl-js': `${__dirname}/../../src`,
    }
  }
  if (env.prod) {
    config.mode = 'production'
    config.devtool = false
  }

  return config
}
