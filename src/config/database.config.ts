import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  const uri = process.env.MONGO_URI;
  console.log('Database URI:', uri);
  
  if (!uri) {
    throw new Error('MONGO_URI environment variable is not set');
  }
  
  return {
    uri,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  };
});
