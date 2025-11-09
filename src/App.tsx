import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProjects from "./pages/admin/Projects";
import TransportationSettings from "./pages/admin/TransportationSettings";
import PresentationFiles from "./pages/admin/PresentationFiles";
import PresentationFieldSettings from "./pages/admin/PresentationFieldSettings";
import ConsentFieldSettings from "./pages/admin/ConsentFieldSettings";
import ReceiptSettings from "./pages/admin/ReceiptSettings";
import ArrivalGuideSettings from "./pages/admin/ArrivalGuideSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/projects" element={<AdminProjects />} />
        <Route path="/admin/projects/:projectId/transportation" element={<TransportationSettings />} />
        <Route path="/admin/projects/:projectId/presentations" element={<PresentationFiles />} />
        <Route path="/admin/projects/:projectId/presentation-fields" element={<PresentationFieldSettings />} />
        <Route path="/admin/projects/:projectId/consent-fields" element={<ConsentFieldSettings />} />
        <Route path="/admin/projects/:projectId/receipt-settings" element={<ReceiptSettings />} />
        <Route path="/admin/projects/:projectId/arrival-guide" element={<ArrivalGuideSettings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
