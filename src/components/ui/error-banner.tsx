'use client';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TriangleAlert } from "lucide-react";

export function ErrorBanner({ 
  title = "Wystąpił błąd", 
  message 
}: { 
  title?: string; 
  message?: string;
}) {
  if (!message) return null;
  
  return (
    <Alert variant="destructive" className="mt-2">
      <TriangleAlert className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="break-words">{message}</AlertDescription>
    </Alert>
  );
}

