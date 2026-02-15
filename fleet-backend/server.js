import app from './app.js';
import {sequelize } from './config/connectdb.js';
const PORT = process.env.PORT;
const startServer = async () => {
  try {
    await sequelize.sync({ alter: true });
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server error:', error);
    process.exit(1);
  }
};
startServer();