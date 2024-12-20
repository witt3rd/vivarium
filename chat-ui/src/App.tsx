"use client";

import { Conversation } from "@/components/conversation";
import { ThemeToggle } from "@/components/theme-toggle";

function App() {
  return (
    <div className="h-screen overflow-hidden bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Conversation />
    </div>
  );
}

export default App;
