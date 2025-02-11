
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing email attachment upload request');
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const emailId = formData.get('emailId');

    if (!file) {
      throw new Error('No file uploaded');
    }

    if (!emailId) {
      throw new Error('No email ID provided');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 10MB limit');
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('File type not allowed');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Sanitize filename and generate path
    const sanitizedFileName = file.name.replace(/[^\x00-\x7F]/g, '');
    const fileExt = sanitizedFileName.split('.').pop();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
    const filePath = `${emailId}/${timestamp}_${crypto.randomUUID()}.${fileExt}`;

    console.log('Uploading file:', {
      fileName: sanitizedFileName,
      size: file.size,
      type: file.type,
      path: filePath
    });

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('email_attachments')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('File upload error:', uploadError);
      throw new Error('Failed to upload file');
    }

    // Create attachment record
    const { data: attachmentData, error: attachmentError } = await supabase
      .from('email_attachments')
      .insert({
        email_id: emailId,
        file_name: sanitizedFileName,
        file_path: filePath,
        content_type: file.type,
        size_bytes: file.size,
        metadata: {
          original_name: file.name,
          upload_timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (attachmentError) {
      console.error('Database insertion error:', attachmentError);
      throw new Error('Failed to save attachment metadata');
    }

    // Update email_logs with attachment info
    const { error: updateError } = await supabase.rpc(
      'update_email_attachment_info',
      { p_email_id: emailId }
    );

    if (updateError) {
      console.error('Error updating email logs:', updateError);
    }

    console.log('Attachment successfully processed:', attachmentData);

    return new Response(
      JSON.stringify({
        message: 'File uploaded successfully',
        attachment: attachmentData
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );

  } catch (error) {
    console.error('Error processing attachment:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to process attachment'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 400
      }
    );
  }
});
