import PlayerDetailPage from "@/components/admin/PlayerDetailPage";

interface PlayerPageProps {
  params: Promise<{ playerId: string }>;
}

export default async function Page({ params }: PlayerPageProps) {
  const { playerId } = await params;
  return <PlayerDetailPage playerId={playerId} />;
}
