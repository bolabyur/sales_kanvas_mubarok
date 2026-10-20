import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ApiError } from "@/lib/api";
import { ME_KEY } from "@/auth/hooks/useAuth";
import "./index.css";
import App from "./App.tsx";

const onError = (e: Error) => {
  if (e instanceof ApiError && e.status === 401) {
    queryClient.setQueryData(ME_KEY, null);
  }
};

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError }),
  mutationCache: new MutationCache({ onError }),
  defaultOptions: {
    queries: {
      retry: (count, e) =>
        !(e instanceof ApiError && e.status < 500) && count < 2,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <App />
        </TooltipProvider>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
