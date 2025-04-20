import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { initCsrfToken } from "./lib/csrfToken";

// Initialize CSRF token before rendering the app
// This ensures the token is registered with the server before any API requests
(async () => {
  try {
    await initCsrfToken();
    console.log("CSRF token initialized successfully");
  } catch (error) {
    console.error("Failed to initialize CSRF token:", error);
  }

  createRoot(document.getElementById("root")!).render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
})();
