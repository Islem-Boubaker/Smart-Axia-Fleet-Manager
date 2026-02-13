import { connectDB, sequelize } from './config/connectdb.js';



const startServer = async (app, PORT) => {
  await connectDB();
  await sequelize.sync({ alter: true });

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

export default startServer;