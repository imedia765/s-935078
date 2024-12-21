import { supabase } from "@/integrations/supabase/client";

export async function getMemberByMemberId(memberId: string) {
  try {
    console.log("Looking up member with ID:", memberId);
    
    // Try exact match first
    let { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('member_number', memberId)
      .maybeSingle();

    if (error) {
      console.error("Database error when looking up member:", error);
      throw error;
    }

    if (!data) {
      console.log("No member found with ID:", memberId);
      return null;
    }

    console.log("Member lookup result:", data);
    return data;
  } catch (error) {
    console.error("Error in getMemberByMemberId:", error);
    return null;
  }
}