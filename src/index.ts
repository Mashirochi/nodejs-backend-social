import { Request, Response } from "express";
import "dotenv/config";
import databaseService from "./services/database.service";
import userRouter from "./routes/user.route";
import express from "express";

const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

databaseService.connect().catch(console.error);
app.use("/users", userRouter);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
