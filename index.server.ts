import type { PluginServerContext } from "@getpaseo/plugin/server";
import { displayPreferences } from "./shared/display";
export default function contribute(server: PluginServerContext) { server.registerSettings(displayPreferences); return () => {}; }
