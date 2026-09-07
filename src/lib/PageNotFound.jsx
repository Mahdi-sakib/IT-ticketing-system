import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PageNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-secondary p-6 text-center">
      <AlertTriangle className="h-12 w-12 text-warning" />
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground max-w-sm">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link to="/dashboard">
        <Button>Back to Dashboard</Button>
      </Link>
    </div>
  );
}
