CREATE TABLE "VisualizerRoom" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "nameEn" TEXT NOT NULL,
  "baseImage" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VisualizerRoom_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VisualizerDesign" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "palette" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VisualizerDesign_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VisualizerRoom_slug_key" ON "VisualizerRoom"("slug");
CREATE INDEX "VisualizerRoom_isActive_sortOrder_idx"
  ON "VisualizerRoom"("isActive", "sortOrder");
CREATE INDEX "VisualizerDesign_userId_updatedAt_idx"
  ON "VisualizerDesign"("userId", "updatedAt");
CREATE INDEX "VisualizerDesign_roomId_idx" ON "VisualizerDesign"("roomId");

ALTER TABLE "VisualizerDesign"
  ADD CONSTRAINT "VisualizerDesign_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VisualizerDesign"
  ADD CONSTRAINT "VisualizerDesign_roomId_fkey"
  FOREIGN KEY ("roomId") REFERENCES "VisualizerRoom"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "VisualizerRoom"
  ("id", "slug", "name", "nameEn", "baseImage", "sortOrder", "updatedAt")
VALUES
  ('visualizer-room-facade', 'facade', 'Mặt tiền nhà', 'House Facade', '/facade_sage.webp', 10, CURRENT_TIMESTAMP),
  ('visualizer-room-living', 'living', 'Phòng khách', 'Living Room', '/living_sage.webp', 20, CURRENT_TIMESTAMP),
  ('visualizer-room-bedroom', 'bedroom', 'Phòng ngủ', 'Bedroom', '/bedroom_beige.webp', 30, CURRENT_TIMESTAMP),
  ('visualizer-room-kitchen', 'kitchen', 'Phòng bếp', 'Kitchen', '/kitchen_grey.webp', 40, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
