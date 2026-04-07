import { LabDashboard } from "@/components/lab/lab-dashboard";

type LabPageProps = {
  params: Promise<{ roomCode: string }>;
};

export default async function LabPage({ params }: LabPageProps) {
  const { roomCode } = await params;
  return <LabDashboard roomCode={roomCode.toUpperCase()} />;
}
