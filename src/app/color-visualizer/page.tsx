import type { Metadata } from "next";
import { VisualizerClient } from "@/components/features/visualizer/VisualizerClient";

export const metadata: Metadata = {
  title: "Phối Màu Trực Quan 3D - Maison de FLOF",
  description: "Trải nghiệm công nghệ phối màu sơn trực quan 3D không gian sống theo phong cách cá nhân.",
};

export default function ColorVisualizerPage() {
  return <VisualizerClient />;
}
