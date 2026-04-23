import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/banners")({
  component: () => (
    <div>
      <h1 className="text-2xl font-bold">Banners</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Server functions ready: getBanners, createBanner, updateBanner, deleteBanner,
        reorderBanners.
      </p>
    </div>
  ),
});
