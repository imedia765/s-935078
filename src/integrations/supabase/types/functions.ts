export interface Functions {
  merge_duplicate_collectors: {
    Args: Record<PropertyKey, never>
    Returns: {
      merged_count: number
      details: string
    }[]
  }
  normalize_collector_name: {
    Args: {
      name: string
    }
    Returns: string
  }
  sync_collector_ids: {
    Args: Record<PropertyKey, never>
    Returns: undefined
  }
  create_profile: {
    Args: {
      p_id: string
      p_email: string
      p_user_id: string
    }
    Returns: void
  }
}