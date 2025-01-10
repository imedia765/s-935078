import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MASTER_REPO = 'https://github.com/imedia765/s-935078.git';

async function execCommand(cmd: string[]): Promise<string> {
  const process = Deno.run({
    cmd,
    stdout: "piped",
    stderr: "piped",
  });
  
  const { code } = await process.status();
  const stdout = new TextDecoder().decode(await process.output());
  const stderr = new TextDecoder().decode(await process.stderrOutput());
  
  process.close();
  
  if (code !== 0) {
    throw new Error(`Command failed: ${stderr}`);
  }
  
  return stdout;
}

async function performGitSync(operation: string, customUrl: string, githubToken: string): Promise<void> {
  const workDir = await Deno.makeTempDir();
  console.log('Working directory:', workDir);

  try {
    if (operation === 'pull') {
      // Pull from master to custom
      console.log('Cloning master repository...');
      await execCommand(['git', 'clone', MASTER_REPO.replace('https://', `https://${githubToken}@`), workDir]);
      
      console.log('Adding custom remote...');
      await execCommand(['git', '-C', workDir, 'remote', 'add', 'custom', customUrl.replace('https://', `https://${githubToken}@`)]);
      
      console.log('Pushing to custom repository...');
      await execCommand(['git', '-C', workDir, 'push', 'custom', 'main:main', '--force']);
    } else if (operation === 'push') {
      // Push from custom to master
      console.log('Cloning custom repository...');
      await execCommand(['git', 'clone', customUrl.replace('https://', `https://${githubToken}@`), workDir]);
      
      console.log('Adding master remote...');
      await execCommand(['git', '-C', workDir, 'remote', 'add', 'master', MASTER_REPO.replace('https://', `https://${githubToken}@`)]);
      
      console.log('Pushing to master repository...');
      await execCommand(['git', '-C', workDir, 'push', 'master', 'main:main', '--force']);
    }
  } finally {
    // Cleanup
    try {
      await Deno.remove(workDir, { recursive: true });
    } catch (error) {
      console.error('Error cleaning up:', error);
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
    const githubToken = Deno.env.get('GITHUB_PAT')
    if (!githubToken) {
      console.error('GitHub PAT not configured')
      throw new Error('GitHub token not configured')
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

    // Perform the actual git operations
    await performGitSync(operation, customUrl, githubToken);
    console.log('Git sync completed successfully');

    // Create log entry
    const { data: logEntry, error: logError } = await supabase
      .from('git_sync_logs')
      .insert({
        operation_type: operation,
        status: 'completed',
        created_by: user.id,
        message: `Successfully synced ${operation === 'push' ? 'to' : 'from'} master repository`
      })
      .select()
      .single()

    if (logError) {
      console.error('Log creation error:', logError)
      throw new Error('Failed to create operation log')
    }

    console.log('Operation log created:', logEntry)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully processed ${operation} operation`,
        details: {
          operation,
          customUrl,
          masterUrl: MASTER_REPO,
          logEntry
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
    console.error('Error in git-sync:', error)

    // Create error log entry
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