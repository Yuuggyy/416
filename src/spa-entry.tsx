import { createRoot } from "react-dom/client";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";

const queryClient = new QueryClient();

const router = createRouter({
  routeTree,
  context: { queryClient },
  scrollRestoration: false,
  defaultPreload: false,
  defaultPreloadStaleTime: 0,
  basepath: "/",
});

const root = createRoot(document.getElementById("root")!);
root.render(<RouterProvider router={router} />);
