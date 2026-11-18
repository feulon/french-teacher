import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell">
      <div className="screen" style={{ padding: "24px 20px" }}>
        <p className="eyebrow">Erro 404</p>
        <h1 className="display" style={{ fontSize: 36, margin: "8px 0 16px" }}>
          Página não encontrada
        </h1>
        <Link href="/" className="btn btn-ghost">
          Voltar para Hoje
        </Link>
      </div>
    </main>
  );
}
