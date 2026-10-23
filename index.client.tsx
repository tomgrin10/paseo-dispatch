import { contributeDisplay } from "./client/display";
import { withNavigation } from "./client/navigation";
import type { PluginClientContext } from "@getpaseo/plugin/client";
import { DispatchSurface } from "./client/dispatch";

export default function contribute(client: PluginClientContext) {
  client.addSurface("dispatch", withNavigation(DispatchSurface, client, "dispatch"));
  const removeDisplay = contributeDisplay(client, {
    id: "dispatch",
    title: "Dispatch",
    icon: "Send",
    surface: "dispatch",
  });
  client.addCommandCenterItem({
    id: "open-dispatch",
    title: "Dispatch a task to the right workspace",
    icon: "Send",
    keywords: ["route", "manager", "workspace", "agent", "task"],
    context: "global",
    onSelect({ openSurface }) {
      openSurface("dispatch");
    },
  });
  return () => { removeDisplay(); };
}
