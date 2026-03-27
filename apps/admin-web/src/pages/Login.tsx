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
      <div className="hidden lg:flex lg:w-[520px] xl:w-[580px] flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, hsl(222 47% 5%), hsl(222 47% 8%), hsl(265 30% 10%))' }}
      >
        {/* Animated grid background */}
        <div className="absolute inset-0 tech-grid-dense opacity-60" />
        <div className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 30% 20%, hsl(210 100% 56% / 0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, hsl(265 89% 60% / 0.06) 0%, transparent 60%)'
          }}
        />

        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-primary/5 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-32 right-10 w-32 h-32 rounded-full bg-accent/5 blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-16">
            <div className="h-9 w-9 rounded-lg gradient-blue-purple flex items-center justify-center glow-blue">
              <span className="text-sm font-bold text-white">OC</span>
            </div>
            <span className="text-base font-semibold gradient-text tracking-tight">OpenClaw</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-2xl font-semibold leading-tight text-foreground" style={{ lineHeight: "1.3" }}>
              内部数字员工<br />管理后台
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground max-w-[340px]">
              统一管理数字员工、Skill、定时任务与审计，构建可信赖的数字员工控制面。
            </p>
          </div>

          <div className="mt-12 space-y-3.5">
            {["数字员工全生命周期管理", "Skill 能力注册与治理", "定时任务与工作监控", "审计日志与权限控制"].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-muted-foreground group">
                <div className="h-2 w-2 rounded-full bg-primary shrink-0 group-hover:shadow-[0_0_8px_hsl(210_100%_56%/0.5)] transition-shadow" />
                <span className="group-hover:text-foreground transition-colors">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 space-y-3 text-xs text-muted-foreground/60">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--status-success))] status-dot-pulse" />
              控制面在线
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--status-success))] status-dot-pulse" />
              定时任务在线
            </span>
            <span className="text-muted-foreground/30">心跳 8s 前</span>
          </div>
          <p className="text-muted-foreground/30">
            内网部署 · Windows Server · Control Plane v1.4.2
          </p>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 tech-grid opacity-30" />

        <div className="relative z-10 w-full max-w-[380px] space-y-8">
          <div className="lg:hidden flex items-center gap-2.5 mb-4">
            <div className="h-8 w-8 rounded-lg gradient-blue-purple flex items-center justify-center glow-blue">
              <span className="text-xs font-bold text-white">OC</span>
            </div>
            <span className="text-base font-semibold gradient-text">OpenClaw</span>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">登录系统</h2>
            <p className="text-sm text-muted-foreground mt-1">使用内部账号登录控制台</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive glow-red">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm">账号</Label>
              <Input id="username" placeholder="工号或邮箱" autoComplete="username" className="input-glow bg-muted/30 border-border/50 focus:border-primary/40" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm">密码</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="输入密码"
                  autoComplete="current-password"
                  className="pr-10 input-glow bg-muted/30 border-border/50 focus:border-primary/40"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
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
                <Input id="captcha" placeholder="输入验证码" className="flex-1 input-glow bg-muted/30 border-border/50 focus:border-primary/40" />
                <div className="h-10 w-24 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center text-xs font-mono text-primary tracking-widest select-none">
                  A7K9
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full mt-2 gradient-blue-purple border-0 hover:opacity-90 glow-blue transition-all">
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
