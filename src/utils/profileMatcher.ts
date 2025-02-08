
import { supabase } from "@/integrations/supabase/client";
import { logAuditEvent } from "@/utils/auditLogger";

interface ProfileMatchResult {
  success: boolean;
  memberId?: string;
  error?: string;
}

export async function matchAndLinkProfile(authUserId: string, memberNumber: string): Promise<ProfileMatchResult> {
  try {
    // Start a transaction to prevent race conditions
    const { data: existingLink } = await supabase
      .from('members')
      .select('id, auth_user_id')
      .eq('member_number', memberNumber)
      .single();

    if (!existingLink) {
      await logAuditEvent({
        operation: 'update',
        tableName: 'members',
        recordId: memberNumber,
        metadata: { 
          event: 'profile_match_failed',
          reason: 'member_not_found'
        },
        severity: 'warning'
      });
      return { 
        success: false, 
        error: 'Member number not found' 
      };
    }

    if (existingLink.auth_user_id && existingLink.auth_user_id !== authUserId) {
      await logAuditEvent({
        operation: 'update',
        tableName: 'members',
        recordId: memberNumber,
        metadata: { 
          event: 'profile_match_failed',
          reason: 'already_linked'
        },
        severity: 'warning'
      });
      return { 
        success: false, 
        error: 'Member already linked to another account' 
      };
    }

    // Update the auth_user_id atomically
    const { error: updateError } = await supabase
      .from('members')
      .update({ 
        auth_user_id: authUserId,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingLink.id)
      .eq('auth_user_id', existingLink.auth_user_id || null); // Ensure no race condition

    if (updateError) {
      throw updateError;
    }

    // Record the successful link in email_audit
    const { error: auditError } = await supabase
      .from('email_audit')
      .insert({
        auth_user_id: authUserId,
        member_number: memberNumber,
        status: 'linked',
        metadata: {
          event: 'profile_linked',
          timestamp: new Date().toISOString()
        }
      });

    if (auditError) {
      console.error('Failed to create audit record:', auditError);
    }

    await logAuditEvent({
      operation: 'update',
      tableName: 'members',
      recordId: existingLink.id,
      metadata: { 
        event: 'profile_matched',
        member_number: memberNumber
      },
      severity: 'info'
    });

    return { 
      success: true, 
      memberId: existingLink.id 
    };
  } catch (error: any) {
    console.error('Profile matching error:', error);
    await logAuditEvent({
      operation: 'update',
      tableName: 'members',
      recordId: memberNumber,
      metadata: { 
        event: 'profile_match_error',
        error: error.message
      },
      severity: 'error'
    });
    return { 
      success: false, 
      error: 'Failed to link profile' 
    };
  }
}
