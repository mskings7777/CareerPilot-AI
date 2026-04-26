import app from './app';
import config from './config';

// Start server
app.listen(config.port, () => {
  console.log(`
  ====================================
    CareerPilot API Server
    Port: ${config.port}
    Env: ${config.nodeEnv}
    Docs: http://localhost:${config.port}/api-docs
  ====================================
  `);
});

export default app;
