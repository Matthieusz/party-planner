import "./styles.css";
import { Runtime } from "foldkit";
import { Layer } from "effect";
import { authClientLayer } from "./auth-client.ts";
import { init, Model, update, view } from "./main.ts";
import { Message } from "./message.ts";

const application = Runtime.makeApplication({
  Model,
  resources: authClientLayer(window.location.origin).pipe(Layer.orDie),
  init,
  update,
  view,
  container: document.getElementById("root"),
  devTools: { Message },
});
Runtime.run(application);
