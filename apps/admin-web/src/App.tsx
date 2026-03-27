import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Agents from "./pages/Agents.tsx";
import AgentDetail from "./pages/AgentDetail.tsx";
import Skills from "./pages/Skills.tsx";
import SkillDetail from "./pages/SkillDetail.tsx";
import Schedules from "./pages/Schedules.tsx";
import Runs from "./pages/Runs.tsx";
import RunDetail from "./pages/RunDetail.tsx";
import Knowledge from "./pages/Knowledge.tsx";
import Templates from "./pages/Templates.tsx";
import Audit from "./pages/Audit.tsx";
import Settings from "./pages/Settings.tsx";
import Nodes from "./pages/Nodes.tsx";
import BotOverview from "./pages/BotOverview.tsx";
import BotModel from "./pages/BotModel.tsx";
import BotSessions from "./pages/BotSessions.tsx";
import BotStats from "./pages/BotStats.tsx";
import BotAlerts from "./pages/BotAlerts.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/agents/:id" element={<AgentDetail />} />
            <Route path="/agents/:id/bot" element={<BotOverview />} />
            <Route path="/agents/:id/bot/model" element={<BotModel />} />
            <Route path="/agents/:id/bot/sessions" element={<BotSessions />} />
            <Route path="/agents/:id/bot/stats" element={<BotStats />} />
            <Route path="/agents/:id/bot/alerts" element={<BotAlerts />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/skills/:id" element={<SkillDetail />} />
            <Route path="/schedules" element={<Schedules />} />
            <Route path="/runs" element={<Runs />} />
            <Route path="/runs/:id" element={<RunDetail />} />
            <Route path="/knowledge" element={<Knowledge />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/nodes" element={<Nodes />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
