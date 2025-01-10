import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MASTER_REPO = 'https://github.com/imedia765/s-935078.git';

async function getGitHubReference(owner: string, repo: string, ref: string, githubToken: string) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${ref}`,
    {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
      }
    }
  );
  
  if (response.status === 404) {
    return null;
  }
  
  if (!response.ok) {
    throw new Error(`Failed to get reference: ${await response.text()}`);
  }
  
  return await response.json();
}

async function createGitHubReference(owner: string, repo: string, ref: string, sha: string, githubToken: string) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/refs`,
    {
      method: 'POST',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: `refs/heads/${ref}`,
        sha: sha
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to create reference: ${await response.text()}`);
  }

  return await response.json();
}

async function updateGitHubReference(owner: string, repo: string, ref: string, sha: string, githubToken: string, force = true) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${ref}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sha: sha,
        force: force
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update reference: ${await response.text()}`);
  }

  return await response.json();
}

async function performGitSync(operation: string, customUrl: string, githubToken: string): Promise<void> {
  const [, customOwner, customRepo] = customUrl.match(/github\.com\/([^\/]+)\/([^\.]+)/) || [];
  const [, masterOwner, masterRepo] = MASTER_REPO.match(/github\.com\/([^\/]+)\/([^\.]+)/) || [];

  if (!customOwner || !customRepo || !masterOwner || !masterRepo) {
    throw new Error('Invalid repository URLs');
  }

  console.log(`Performing ${operation} between ${customUrl} and ${MASTER_REPO}`);

  if (operation === 'pull') {
    // Get master branch reference
    const masterRef = await getGitHubReference(masterOwner, masterRepo, 'main', githubToken);
    if (!masterRef) {
      throw new Error('Master branch reference not found');
    }

    // Update or create custom branch reference
    const customRef = await getGitHubReference(customOwner, customRepo, 'main', githubToken);
    if (customRef) {
      await updateGitHubReference(customOwner, customRepo, 'main', masterRef.object.sha, githubToken);
    } else {
      await createGitHubReference(customOwner, customRepo, 'main', masterRef.object.sha, githubToken);
    }

  } else if (operation === 'push') {
    // Get custom branch reference
    const customRef = await getGitHubReference(customOwner, customRepo, 'main', githubToken);
    if (!customRef) {
      throw new Error('Custom branch reference not found');
    }

    // Update or create master branch reference
    const masterRef = await getGitHubReference(masterOwner, masterRepo, 'main', githubToken);
    if (masterRef) {
      await updateGitHubReference(masterOwner, masterRepo, 'main', customRef.object.sha, githubToken);
    } else {
      await createGitHubReference(masterOwner, masterRepo, 'main', customRef.object.sha, githubToken);
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting git sync operation...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables')
      throw new Error('Server configuration error')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header')
      throw new Error('No authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      console.error('Auth error:', authError)
      throw new Error('Invalid token')
    }

    console.log('User authenticated:', user.id)

    // Parse request body
    const { operation, customUrl } = await req.json()
    console.log('Processing git sync operation:', { operation, customUrl, masterUrl: MASTER_REPO })

    if (!operation || !customUrl) {
      throw new Error('Operation type and custom repository URL are required')
    }

    // Verify GitHub token exists
    const githubToken = Deno.env.get('GITHUB_PAT');
    if (!githubToken) {
      console.error('GitHub PAT not configured');
      throw new Error('GitHub token not configured');
    }

    // Verify repository access
    const repoToCheck = operation === 'push' ? MASTER_REPO : customUrl;
    const repoPath = repoToCheck.replace('https://github.com/', '').replace('.git', '')
    console.log('Checking repository access:', repoPath)
    
    const repoCheckResponse = await fetch(
      `https://api.github.com/repos/${repoPath}`,
      {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Supabase-Edge-Function'
        }
      }
    )

    if (!repoCheckResponse.ok) {
      const errorData = await repoCheckResponse.text()
      console.error('Repository check failed:', errorData)
      throw new Error(`Repository access failed: ${errorData}`)
    }

    console.log('Repository access verified successfully')

    // Create a log entry for the verification
    const { data: logEntry, error: logError } = await supabase
      .from('git_sync_logs')
      .insert({
        operation_type: operation,
        status: 'completed',
        created_by: user.id,
        message: `Successfully verified access to ${repoToCheck}`
      })
      .select()
      .single()

    if (logError) {
      console.error('Log creation error:', logError)
      throw new Error('Failed to create operation log')
    }

    console.log('Operation log created:', logEntry)

    // Perform the actual git operations
    await performGitSync(operation, customUrl, githubToken);

    // Create success log entry
    await supabase
      .from('git_sync_logs')
      .insert({
        operation_type: operation,
        status: 'completed',
        created_by: user.id,
        message: `Successfully synced ${operation === 'push' ? 'to' : 'from'} master repository`
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully processed ${operation} operation`,
        details: {
          operation,
          customUrl,
          masterUrl: MASTER_REPO
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in git-sync:', error);

    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        await supabase
          .from('git_sync_logs')
          .insert({
            operation_type: 'error',
            status: 'failed',
            message: error instanceof Error ? error.message : 'Unknown error',
            error_details: error instanceof Error ? error.stack : undefined
          })
      }
    } catch (logError) {
      console.error('Failed to create error log:', logError)
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})