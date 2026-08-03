import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { verifyEmailTransport } from './email/emailTransport.js';

connectDB()
  .then(async () => {
    await verifyEmailTransport();
    app.listen(env.port, () => console.log(`Server running on port ${env.port}`));
  })
  .catch((error) => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  });
