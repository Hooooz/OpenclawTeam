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
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-sidebar-primary flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-sidebar-primary-foreground">OC</span>
          </div>
          {!collapsed && <span className="text-sm font-semibold text-sidebar-accent-foreground tracking-tight">OpenClaw</span>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            {!collapsed && (
              <p className="px-3 mb-1 text-[10px] uppercase tracking-widest text-sidebar-foreground/50 font-medium">
                {group.label}
              </p>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} end={item.url === "/"} activeClassName="bg-sidebar-accent text-sidebar-accent-foreground">
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
            <div className="h-6 w-6 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-[10px] font-medium text-sidebar-accent-foreground">管</span>
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-xs text-sidebar-accent-foreground leading-none">管理员</span>
                <span className="text-[10px] text-sidebar-foreground/60 leading-tight mt-0.5">超级管理员</span>
              </div>
            )}
          </div>
          {!collapsed && <SidebarTrigger className="text-sidebar-foreground/50 hover:text-sidebar-accent-foreground" />}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
