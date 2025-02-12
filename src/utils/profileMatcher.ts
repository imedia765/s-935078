
import { supabase } from "@/integrations/supabase/client";
import { logAuditEvent } from "@/utils/auditLogger";

interface ProfileMatchResult {
  success: boolean;
  memberId?: string;
  error?: string;
}

export async function matchAndLinkProfile(authUserId: string, memberNumber: string): Promise<ProfileMatchResult> {
  try {
    // First check if there's an existing member with this number
    const { data: existingLink, error: fetchError } = await supabase
      .from('members')
      .select('id, auth_user_id')
      .eq('member_number', memberNumber)
      .single();

    if (fetchError) {
      console.error('Error fetching member:', fetchError);
      throw new Error('Failed to check member status');
    }

    if (!existingLink) {
      try {
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
      } catch (auditError) {
        console.error('Failed to log audit event:', auditError);
      }
      
      return { 
        success: false, 
        error: 'Member number not found' 
      };
    }

    // If member exists but is linked to another account
    if (existingLink.auth_user_id && existingLink.auth_user_id !== authUserId) {
      // Clear the existing auth_user_id if it's a reset case
      const { error: updateError } = await supabase
        .from('members')
        .update({ 
          auth_user_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLink.id);

      if (updateError) {
        console.error('Error clearing existing auth link:', updateError);
        throw updateError;
      }

      // Now try to link again
      const { error: linkError } = await supabase
        .from('members')
        .update({ 
          auth_user_id: authUserId,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLink.id);

      if (linkError) {
        throw linkError;
      }
    } else {
      // Update the auth_user_id atomically
      const { error: updateError } = await supabase
        .from('members')
        .update({ 
          auth_user_id: authUserId,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLink.id)
        .is('auth_user_id', null); // Ensure no race condition

      if (updateError) {
        throw updateError;
      }
    }

    // Record the successful link in audit_logs table
    try {
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          operation: 'update',
          table_name: 'members',
          record_id: existingLink.id, // Using the actual UUID here
          metadata: { 
            event: 'profile_matched',
            member_number: memberNumber
          },
          severity: 'info'
        });

      if (auditError) {
        console.error('Failed to create audit record:', auditError);
      }
    } catch (auditError) {
      console.error('Failed to insert audit record:', auditError);
    }

    return { 
      success: true, 
      memberId: existingLink.id 
    };
  } catch (error: any) {
    console.error('Profile matching error:', error);
    
    try {
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
    } catch (auditError) {
      console.error('Failed to log audit event:', auditError);
    }
    
    return { 
      success: false, 
      error: 'Failed to link profile' 
    };
  }
}
