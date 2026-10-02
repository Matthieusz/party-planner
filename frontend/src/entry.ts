import "./styles.css";
import { Runtime } from "foldkit";
import { init, Model, update, view } from "./main.ts";
import { Message } from "./message.ts";

const application = Runtime.makeApplication({
  Model,
  init,
  update,
  view,
  container: document.getElementById("root"),
  devTools: { Message },
});
Runtime.run(application);
