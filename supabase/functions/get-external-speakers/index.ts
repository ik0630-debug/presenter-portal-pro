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
    const { projectId } = await req.json();
    
    console.log('Fetching speakers for external project:', projectId);

    // Connect to external Supabase
    const externalSupabase = createClient(
      Deno.env.get('EXTERNAL_SUPABASE_URL')!,
      Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY')!
    );

    // First, get the suppliers table structure to see what columns are available
    const { data: sampleSupplier, error: structureError } = await externalSupabase
      .from('suppliers')
      .select('*')
      .limit(1)
      .single();

    if (structureError) {
      console.error('Failed to fetch supplier structure:', structureError);
    } else {
      console.log('Supplier table columns:', Object.keys(sampleSupplier || {}));
    }

    // Get project_speakers with supplier relationship
    // Try to get all fields from suppliers to see what's available
    const { data: projectSpeakers, error: speakersError } = await externalSupabase
      .from('project_speakers')
      .select(`
        supplier_id,
        suppliers (*)
      `)
      .eq('project_id', projectId);

    if (speakersError) {
      console.error('Failed to fetch speakers:', speakersError);
      throw speakersError;
    }

    console.log('Project speakers data:', projectSpeakers);

    // Transform the data - handle different possible field names
    const speakers = projectSpeakers
      ?.filter((ps: any) => ps.suppliers)
      .map((ps: any) => {
        const supplier = ps.suppliers;
        return {
          id: supplier.id,
          name: supplier.name || supplier.supplier_name || supplier.full_name || supplier.title || 'Unknown',
          email: supplier.email || supplier.contact_email || null,
          organization: supplier.organization || supplier.company || null,
          department: supplier.department || null,
          position: supplier.position || supplier.job_title || null,
          phone: supplier.phone || supplier.mobile || supplier.contact_phone || null,
        };
      }) || [];

    console.log(`Found ${speakers.length} speakers`);

    return new Response(
      JSON.stringify({ speakers }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('Error in get-external-speakers:', error);
    return new Response(
      JSON.stringify({ 
        error: '연사 목록을 가져오는 중 오류가 발생했습니다.',
        details: error?.message || 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
