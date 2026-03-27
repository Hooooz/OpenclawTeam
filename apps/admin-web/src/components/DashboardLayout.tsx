import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Navigation Bar */}
          <header className="h-12 flex items-center justify-between border-b border-border/60 bg-card/80 backdrop-blur-md px-4 shrink-0 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-primary transition-colors md:hidden" />
              <SidebarTrigger className="text-muted-foreground hover:text-primary transition-colors hidden md:flex" />
              <div className="hidden sm:flex relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                <Input
                  placeholder="搜索数字员工、Skill、任务…"
                  className="h-8 w-64 pl-8 text-xs bg-muted/30 border-border/50 focus:border-primary/40 input-glow transition-all"
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[hsl(var(--status-danger))] status-dot-pulse" />
              </Button>
              <div className="h-7 w-7 rounded-full gradient-blue-purple flex items-center justify-center text-[10px] font-medium text-white">
                管
              </div>
            </div>
          </header>
          {/* Main Content */}
          <main className="flex-1 overflow-auto tech-grid">
            <div className="page-enter">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
