import { createRoot } from "react-dom/client";
import { createRouter, RouterProvider, createHashHistory } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";

// Entree dediee a l'APK Android (WebView file://) :
// en contexte file://, l'History API est bloquee — on route par hash (#/casting).
const queryClient = new QueryClient();

const router = createRouter({
  routeTree,
  context: { queryClient },
  scrollRestoration: false,
  defaultPreload: false,
  defaultPreloadStaleTime: 0,
  basepath: import.meta.env.BASE_PATH ?? "/",
  history: createHashHistory(),
});

const root = createRoot(document.getElementById("root")!);
root.render(<RouterProvider router={router} />);
