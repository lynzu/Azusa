import express from 'express';
const app = express();

const server = port => {
  app.get('/', (req, res) => res.json({ status: true }));
  app.listen(port || 3000, () => console.log('Server is running'));
  return app;
};

export default server;
