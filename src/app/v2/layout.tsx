import V2TopNav from "@/components/layout/V2TopNav";

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <V2TopNav />
      <div className="pt-12">
        {children}
      </div>
    </div>
  );
}
