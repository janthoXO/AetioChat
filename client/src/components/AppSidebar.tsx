import { NavLink } from "react-router-dom";
import { useCases } from "@/contexts/CasesContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { PlusCircle, LogOut, CheckCircle2 } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { myCases, newCases, generateCase, isGenerating } = useCases();
  const { user, logout } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <h2 className="text-xl font-bold tracking-tight">AetioChat</h2>
        <p className="text-sm text-muted-foreground">Dr. {user?.username || "Doctor"}</p>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>My Cases</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {myCases.length === 0 ? (
                <SidebarMenuItem className="pl-4 text-muted-foreground">
                  No cases started yet.
                </SidebarMenuItem>
              ) : (
                myCases.map((c) => (
                  <SidebarMenuItem key={c.id}>
                    <SidebarMenuButton asChild isActive={false /* Router match logic could go here */}>
                      <NavLink to={`/chat/${c.id}`} className="flex items-center justify-between">
                        <span className="truncate flex-1">{c.chiefComplaint}</span>
                        {c.completed && <CheckCircle2 className="h-4 w-4 text-green-500 ml-2" />}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel>New Cases</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {newCases.map((c) => (
                <SidebarMenuItem key={c.id}>
                  {c.createdAt ? (
                    <SidebarMenuButton asChild>
                      <NavLink to={`/chat/${c.id}`}>
                        <span className="truncate">{c.chiefComplaint}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton disabled>
                      <span className="truncate italic text-muted-foreground mr-2">Generating...</span>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
              {newCases.length === 0 && (
                <SidebarMenuItem className="pl-4 text-muted-foreground">
                  No new cases available.
                </SidebarMenuItem>
              )}
              {user?.role === "admin" && (
                <SidebarMenuItem className="mt-4">
                  <SidebarMenuButton variant="outline" onClick={generateCase} disabled={isGenerating}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {isGenerating ? "Generating..." : "Generate New Case"}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <Button variant="ghost" className="w-full justify-start text-destructive" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
