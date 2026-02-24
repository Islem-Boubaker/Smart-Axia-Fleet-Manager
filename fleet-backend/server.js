import app from './app.js';
import {sequelize } from './config/connectdb.js';
import './models/index.js';

const PORT = process.env.PORT;
async function startServer() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log("✅ Supabase connected successfully!");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Unable to connect:", error);
  }
}



startServer();

