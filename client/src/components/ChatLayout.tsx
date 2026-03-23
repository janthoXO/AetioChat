import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { CasesProvider } from "@/contexts/CasesContext";

export function ChatLayout() {
  return (
    <CasesProvider>
      <SidebarProvider>
        <div className="flex h-screen w-full overflow-hidden bg-background">
          <AppSidebar />
          <div className="flex flex-col flex-1 h-full overflow-hidden relative">
            <header className="absolute top-0 w-full p-4 flex items-center z-10 bg-background/80 backdrop-blur-sm border-b">
              <SidebarTrigger />
              <h1 className="ml-4 font-semibold text-sm truncate">Case Chat</h1>
            </header>
            <main className="flex-1 overflow-hidden relative pt-[73px]">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </CasesProvider>
  );
}
