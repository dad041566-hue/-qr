-- ============================================================
-- Migration: 20260331000003_storage_menu_images
-- menu-images Storage 버킷 생성 (public)
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- 인증된 사용자(owner/manager)만 업로드 가능
CREATE POLICY "menu_images_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'menu-images');

-- 누구나 읽기 가능 (고객 메뉴 이미지 노출)
CREATE POLICY "menu_images_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'menu-images');

-- 인증된 사용자만 삭제 가능
CREATE POLICY "menu_images_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'menu-images');
