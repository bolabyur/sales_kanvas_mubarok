import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Toaster, toast } from "sonner"; 
import { TooltipProvider } from "@/components/ui/tooltip";
import { ApiError } from "@/lib/api";
import { ME_KEY } from "@/auth/hooks/useAuth";
import "./index.css";
import App from "./App.tsx";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: unknown) => { 
      if (error instanceof ApiError) {
        if (error.status === 401 || error.status === 403) return;
        
        toast.error(error.message || "Terjadi kesalahan saat mengambil data");
      }
    }
  }),
  mutationCache: new MutationCache({
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          queryClient.setQueryData(ME_KEY, null);
        } else if (error.status === 403) {
          return; 
        } else {
          toast.error(error.message || "Gagal menyimpan data", {
            description: error.details 
          });
        }
      } else if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  }),
  defaultOptions: {
    queries: {
      retry: (count, e: unknown) => {
        if (e instanceof ApiError) {
          if (e.status === 401 || e.status === 403) return false;
          return e.status >= 500 && count < 2;
        }
        return count < 2;
      },
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
      </BrowserRouter>
      <Toaster position="top-right" closeButton /> 
    </QueryClientProvider>
  </StrictMode>,
);