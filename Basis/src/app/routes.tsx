import { createBrowserRouter } from "react-router";
import { DashboardLayout } from "./components/DashboardLayout";
import { Overview } from "./components/Overview";
import { Analytics } from "./components/Analytics";
import { SystemMonitor } from "./components/SystemMonitor";
import { DataStream } from "./components/DataStream";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: DashboardLayout,
    children: [
      { index: true, Component: Overview },
      { path: "analytics", Component: Analytics },
      { path: "system", Component: SystemMonitor },
      { path: "stream", Component: DataStream },
    ],
  },
]);
