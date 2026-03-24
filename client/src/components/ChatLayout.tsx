import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { CasesProvider } from "@/contexts/CasesContext";

export function ChatLayout() {
  return (
    <CasesProvider>
      <SidebarProvider>
        <div className="flex h-screen w-full overflow-hidden">
          <AppSidebar />
          <div className="flex-1 flex flex-col h-screen overflow-hidden">
            <header className="w-full p-4 flex items-center shrink-0 z-10 backdrop-blur-sm border-b">
              <SidebarTrigger />
              <h1 className="ml-4 font-semibold text-sm truncate">Case Chat</h1>
            </header>
            <main className="flex-1 flex flex-col min-h-0">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </CasesProvider>
  );
}
