export default () => {
  return {
    port: parseInt(process.env['PORT'] || '8081', 10),
    nodeEnv: process.env['NODE_ENV'] || 'development',
    database: {
      uri: process.env.MONGO_URI,
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    logLevel: process.env['LOG_LEVEL'] || 'info',
  };
};
