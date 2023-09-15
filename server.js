const app = require("./app");
const { createFolderIfNotExist, uploadDir } = require("./middleware/upload");

const mongoose = require("mongoose");

require("dotenv").config();

const PORT = process.env.PORT || 3000;

const connection = mongoose.connect(process.env.DATABASE_URL, {
  dbName: "db-contacts",
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

connection
  .then(() => {
    console.log("Database connection successful");
    app.listen(PORT, () => {
      createFolderIfNotExist(uploadDir);
      console.log(`Server running. Use our API on port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(`Server not running. Error message: [${err}]\n`);
    process.exit(1);
  });
