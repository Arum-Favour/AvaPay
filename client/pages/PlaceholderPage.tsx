import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <Plus className="h-10 w-10 text-primary animate-pulse" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            This module is currently being finalized. Stay tuned for the complete enterprise-grade experience.
          </p>
        </div>
        <Button size="lg" className="rounded-full shadow-lg shadow-primary/20">
          Request Early Access
        </Button>
      </div>
    </Layout>
  );
}
