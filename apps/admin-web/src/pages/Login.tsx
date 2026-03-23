import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Eye, EyeOff, Shield } from "lucide-react";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("用户名或密码错误，请重试");
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[520px] xl:w-[580px] bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] flex-col justify-between p-10">
        <div>
          <div className="flex items-center gap-2.5 mb-16">
            <div className="h-8 w-8 rounded bg-[hsl(var(--sidebar-primary))] flex items-center justify-center">
              <span className="text-xs font-bold text-white">OC</span>
            </div>
            <span className="text-base font-semibold tracking-tight text-[hsl(var(--sidebar-accent-foreground))]">OpenClaw</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-2xl font-semibold leading-tight text-[hsl(var(--sidebar-accent-foreground))]" style={{ lineHeight: "1.3" }}>
              内部数字员工<br />管理后台
            </h1>
            <p className="text-sm leading-relaxed text-[hsl(var(--sidebar-foreground))] max-w-[340px]">
              统一管理数字员工、Skill、定时任务与审计，构建可信赖的数字员工控制面。
            </p>
          </div>

          <div className="mt-12 space-y-3">
            {["数字员工全生命周期管理", "Skill 能力注册与治理", "定时任务与工作监控", "审计日志与权限控制"].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-[hsl(var(--sidebar-foreground))]">
                <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--sidebar-primary))] shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 text-xs text-[hsl(var(--sidebar-foreground))]/60">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--status-success))]" />
              控制面在线
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--status-success))]" />
              定时任务在线
            </span>
            <span className="text-[hsl(var(--sidebar-foreground))]/40">心跳 8s 前</span>
          </div>
          <p className="text-[hsl(var(--sidebar-foreground))]/40">
            内网部署 · Windows Server · Control Plane v1.4.2
          </p>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[380px] space-y-8">
          <div className="lg:hidden flex items-center gap-2.5 mb-4">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">OC</span>
            </div>
            <span className="text-base font-semibold text-foreground">OpenClaw</span>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">登录系统</h2>
            <p className="text-sm text-muted-foreground mt-1">使用内部账号登录控制台</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm">账号</Label>
              <Input id="username" placeholder="工号或邮箱" autoComplete="username" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm">密码</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="输入密码"
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="captcha" className="text-sm">验证码</Label>
              <div className="flex gap-3">
                <Input id="captcha" placeholder="输入验证码" className="flex-1" />
                <div className="h-10 w-24 rounded-md bg-muted border flex items-center justify-center text-xs font-mono text-muted-foreground tracking-widest select-none">
                  A7K9
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full mt-2">
              <Shield className="h-4 w-4 mr-1.5" />
              登 录
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center">
            如需账号或重置密码，请联系系统管理员
          </p>
        </div>
      </div>
    </div>
  );
}
