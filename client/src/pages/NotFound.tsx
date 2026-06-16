import { Link } from "wouter";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl font-bold text-muted-foreground">4</span>
          <Home className="w-10 h-10 text-primary" />
          <span className="text-5xl font-bold text-muted-foreground">4</span>
        </div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Page not found</h1>
        <p className="text-muted-foreground mt-3 leading-relaxed">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div className="flex gap-3 justify-center mt-8">
          <Link href="/"
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg transition-colors">
            <Home className="w-4 h-4" /> Go home
          </Link>
          <button onClick={() => window.history.back()}
            className="flex items-center gap-2 px-5 py-2.5 bg-muted hover:bg-accent text-sm font-medium rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" /> Go back
          </button>
        </div>
      </div>
    </div>
  );
}
