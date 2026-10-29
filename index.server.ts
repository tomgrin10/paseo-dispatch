import type { PluginServerContext } from "@getpaseo/plugin/server";
import { displayPreferences } from "./shared/display";
import { contributeAgentTools } from "./server/native-tools.ts";
export default function contribute(server: PluginServerContext) {
  server.registerSettings(displayPreferences);
  return contributeAgentTools(server);
}
