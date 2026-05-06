import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useAuth } from "../../core/auth";
import { getErrorMessage } from "../../core/api";

export default function RegisterPage() {
  const { register, isAuthenticated, ready } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate, ready]);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success("Conta criada com sucesso");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, "Falha no registro"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Como você se chama?</Label>
          <Input 
            id="name" 
            required 
            placeholder="Seu nome"
            value={name} 
            onChange={(e) => setName(e.target.value)} 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Seu melhor email</Label>
          <Input
            id="email"
            type="email"
            required
            placeholder="exemplo@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Crie uma senha</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Criando conta..." : "Criar conta gratuita"}
        </Button>
      </form>
      <div className="text-center text-sm">
        <span className="text-muted-foreground">Já tem uma conta? </span>
        <Link to="/login" className="font-medium text-primary hover:underline">
          Faça login
        </Link>
      </div>
    </div>
  );
}


