ALTER TABLE "Blog"
  ADD COLUMN "category" TEXT NOT NULL DEFAULT 'Xu Hướng Thiết Kế',
  ADD COLUMN "categoryEn" TEXT NOT NULL DEFAULT 'Design Trends';

CREATE INDEX "Blog_isActive_category_createdAt_idx"
  ON "Blog"("isActive", "category", "createdAt");
