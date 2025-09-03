import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  console.log('Loading JWT config...');
  console.log('JWT_SECRET from env:', process.env.JWT_SECRET);
  
  const config = {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  };
  
  console.log('JWT config loaded:', config);
  return config;
});
