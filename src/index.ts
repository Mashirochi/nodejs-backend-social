import { Request, Response } from "express";
import databaseService from "./services/database.service";
import express from "express";
import responser from "./utils/format.response";
import { defaultErrorHandler } from "./middlewares/error.middleware";
import AppRoute from "./routes/app.route";
import envConfig from "./utils/validateEnv";

const app = express();
const port = envConfig.PORT || 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(responser);

databaseService.connect().catch(console.error);
// all api go here
AppRoute(app);
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

// Error handler must be placed after all routes
app.use(defaultErrorHandler);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
