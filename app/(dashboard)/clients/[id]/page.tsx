import WorkspacePage from "@/components/workspace/WorkspacePage";
export const metadata = {
  title: "Client profile | SwiftCare",
  robots: { index: false },
};
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <WorkspacePage view="client" id={(await params).id} />;
}
