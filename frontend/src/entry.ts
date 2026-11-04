import "./styles.css";
import { Runtime } from "foldkit";
import { Layer } from "effect";
import { authClientLayer } from "./identity/auth-client.ts";
import { identityClientLayer } from "./identity/identity-client.ts";
import { init, Model, update, view } from "./identity/main.ts";
import { Message } from "./identity/message.ts";

const application = Runtime.makeApplication({
  Model,
  resources: Layer.merge(authClientLayer(window.location.origin), identityClientLayer).pipe(
    Layer.orDie,
  ),
  init,
  update,
  view,
  container: document.getElementById("root"),
  devTools: { Message },
});
Runtime.run(application);
