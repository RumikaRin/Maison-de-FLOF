import { ProfileClient } from "@/components/features/profile/ProfileClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile - Maison de FLOF",
  description: "Personal settings, order history, and saved products",
};

export default function ProfilePage() {
  return <ProfileClient />;
}
