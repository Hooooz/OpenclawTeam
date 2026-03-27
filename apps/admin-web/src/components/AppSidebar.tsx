import {
  LayoutDashboard,
  Bot,
  Zap,
  BookOpen,
  FileText,
  CalendarClock,
  MessageSquareText,
  Shield,
  Settings,
  HardDrive,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navGroups = [
  {
    label: "概览",
    items: [
      { title: "控制台总览", url: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "核心资源",
    items: [
      { title: "数字员工管理", url: "/agents", icon: Bot },
      { title: "Skill 管理", url: "/skills", icon: Zap },
      { title: "知识源", url: "/knowledge", icon: BookOpen },
      { title: "任务模板", url: "/templates", icon: FileText },
    ],
  },
  {
    label: "运行与调度",
    items: [
      { title: "定时任务", url: "/schedules", icon: CalendarClock },
      { title: "对话与工作记录", url: "/runs", icon: MessageSquareText },
    ],
  },
  {
    label: "治理",
    items: [
      { title: "审计日志", url: "/audit", icon: Shield },
      { title: "节点管理", url: "/nodes", icon: HardDrive },
      { title: "系统配置", url: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const isActive = (url: string) => {
    if (url === "/") return location.pathname === "/";
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2.5">
          <div className="relative h-8 w-8 rounded-lg gradient-blue-purple flex items-center justify-center shrink-0 glow-blue">
            <span className="text-xs font-bold text-white tracking-tight">OC</span>
            <div className="absolute inset-0 rounded-lg bg-white/10 animate-pulse" style={{ animationDuration: '3s' }} />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold gradient-text tracking-tight">OpenClaw</span>
              <span className="text-[9px] text-sidebar-foreground/40 tracking-widest uppercase">Control Center</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            {!collapsed && (
              <div className="flex items-center gap-2 px-3 mb-1.5">
                <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 font-medium shrink-0">
                  {group.label}
                </p>
                <div className="h-px flex-1 bg-gradient-to-l from-primary/20 to-transparent" />
              </div>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        activeClassName="bg-primary/10 text-primary border-l-2 border-primary shadow-[inset_0_0_12px_-4px_hsl(210_100%_56%/0.15)]"
                        className="transition-all duration-200 hover:bg-primary/5"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="px-3 py-3 border-t border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative h-7 w-7 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
              <span className="text-[10px] font-medium text-primary-foreground">管</span>
              <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[hsl(var(--status-success))] border border-sidebar-background status-dot-pulse" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-xs text-sidebar-accent-foreground leading-none">管理员</span>
                <span className="text-[10px] text-sidebar-foreground/50 leading-tight mt-0.5">超级管理员</span>
              </div>
            )}
          </div>
          {!collapsed && <SidebarTrigger className="text-sidebar-foreground/40 hover:text-primary transition-colors" />}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
