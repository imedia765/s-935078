
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export const captureAndSaveScreenshot = async (elementId: string, fileName: string) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    const canvas = await html2canvas(element);
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/png');
    });

    if (!blob) {
      throw new Error('Failed to create image');
    }

    const filePath = `${fileName}-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from('profile_screenshots')
      .upload(filePath, blob);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('profile_screenshots')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error: any) {
    console.error('Screenshot capture error:', error);
    throw error;
  }
};

