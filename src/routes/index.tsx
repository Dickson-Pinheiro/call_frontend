import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video, Mail, Lock, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/app/dashboard" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-linear-to-br from-background via-background to-primary/10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary gradient-glow mb-4">
            <Video className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-gradient">RandomCall</h1>
          <p className="text-muted-foreground mt-2">Conecte-se com pessoas do mundo todo</p>
        </div>

        {/* Form */}
        <div className="glass rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-6">Entrar na sua conta</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12 bg-secondary/50 border-border/50 focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 pr-11 h-12 bg-secondary/50 border-border/50 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
              Entrar
            </Button>
          </form>

          <p className="text-center mt-6 text-muted-foreground">
            Não tem uma conta?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
