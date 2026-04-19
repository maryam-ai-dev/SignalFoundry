import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { CommandPaletteProvider } from "@/components/CommandPalette";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CommandPaletteProvider>
      <Sidebar />
      <TopBar />
      <main className="ml-56 mt-14 flex-1 overflow-y-auto p-6">{children}</main>
    </CommandPaletteProvider>
  );
}
