import { Link } from "react-router";
import { Button } from "./ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <h2 className="mt-4 text-2xl font-semibold">Página não encontrada</h2>
      <p className="mt-2 text-muted-foreground">
        A página que você está procurando não existe ou foi movida.
      </p>
      <Button asChild className="mt-8">
        <Link to="/dashboard">Voltar para o Início</Link>
      </Button>
    </div>
  );
}
