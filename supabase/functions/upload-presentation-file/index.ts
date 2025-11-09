import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const session_id = formData.get('session_id') as string;
    const is_primary = formData.get('is_primary') === 'true';
    
    if (!file || !session_id) {
      throw new Error('파일 또는 세션 ID가 누락되었습니다.');
    }

    console.log('Uploading presentation file for session:', session_id);

    // Connect to external Supabase
    const externalSupabase = createClient(
      Deno.env.get('EXTERNAL_SUPABASE_URL')!,
      Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Upload to external storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${session_id}_${Date.now()}.${fileExt}`;
    const filePath = `${session_id}/${fileName}`;

    const { error: uploadError } = await externalSupabase.storage
      .from('presentations')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Save file info to external DB
    const { data: fileRecord, error: dbError } = await externalSupabase
      .from('presentation_files')
      .insert({
        session_id,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        is_primary,
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB error:', dbError);
      // Rollback: delete uploaded file
      await externalSupabase.storage
        .from('presentations')
        .remove([filePath]);
      throw dbError;
    }

    console.log('Successfully uploaded file:', fileRecord.id);

    return new Response(
      JSON.stringify({ file: fileRecord }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('Error in upload-presentation-file:', error);
    return new Response(
      JSON.stringify({ 
        error: '파일 업로드 중 오류가 발생했습니다.',
        details: error?.message || 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
