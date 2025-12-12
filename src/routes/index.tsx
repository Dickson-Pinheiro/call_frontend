import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useLogin } from "@/services";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { redirectIfAuthenticated } from "@/lib/auth";

type LoginSearch = {
  redirect?: string;
}

export const Route = createFileRoute('/')({
  beforeLoad: redirectIfAuthenticated,
  validateSearch: (search: Record<string, unknown>): LoginSearch => {
    return {
      redirect: search.redirect as string | undefined,
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();

  const login = useLogin({
    onSuccess: () => {
      navigate({ to: redirect || '/app/dashboard' });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    login.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">


      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary gradient-glow mb-4">
            <Video className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-gradient">RandomCall</h1>
          <p className="text-muted-foreground mt-2">Conecte-se com pessoas do mundo todo</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-6">Entrar na sua conta</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  {...register("email")}
                  className="pl-11 h-12 bg-secondary/50 border-border/50 focus:border-primary"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
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
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {login.isError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">
                  {login.error?.message || "Erro ao fazer login. Verifique suas credenciais."}
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={login.isPending}
              className="w-full h-12 gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
            >
              {login.isPending ? "Entrando..." : "Entrar"}
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
