import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { CommandPaletteProvider } from "@/components/CommandPalette";
import GlobalCommands from "@/components/GlobalCommands";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CommandPaletteProvider>
      <GlobalCommands />
      <Sidebar />
      <TopBar />
      <main className="ml-56 mt-14 flex-1 overflow-y-auto p-6">{children}</main>
    </CommandPaletteProvider>
  );
}
