-- Fonction pour envoyer des notifications en masse
-- Utile pour les campagnes marketing ou les annonces système

CREATE OR REPLACE FUNCTION send_bulk_notification(
  notification_title TEXT,
  notification_message TEXT,
  notification_type TEXT DEFAULT 'ANNOUNCEMENT',
  user_group TEXT DEFAULT 'all', -- all, customers, sellers, admins
  specific_user_ids UUID[] DEFAULT NULL,
  action_url TEXT DEFAULT NULL,
  action_label TEXT DEFAULT 'Voir plus',
  priority TEXT DEFAULT 'medium'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_users INTEGER := 0;
  notification_id BIGINT;
  user_record RECORD;
  bulk_result JSON;
BEGIN
  -- Créer la notification de base
  INSERT INTO notifications (
    type,
    title,
    message,
    action_url,
    action_label,
    priority,
    created_at
  ) VALUES (
    notification_type,
    notification_title,
    notification_message,
    action_url,
    action_label,
    priority,
    NOW()
  )
  RETURNING id INTO notification_id;

  -- Déterminer les utilisateurs cibles
  IF specific_user_ids IS NOT NULL AND array_length(specific_user_ids, 1) > 0 THEN
    -- Utilisateurs spécifiques
    INSERT INTO notification_recipients (notification_id, user_id)
    SELECT notification_id, unnest(specific_user_ids);
    
    GET DIAGNOSTICS affected_users = ROW_COUNT;
    
  ELSE
    -- Groupe d'utilisateurs
    CASE user_group
      WHEN 'all' THEN
        INSERT INTO notification_recipients (notification_id, user_id)
        SELECT notification_id, id FROM users WHERE deleted_at IS NULL;
        
      WHEN 'customers' THEN
        INSERT INTO notification_recipients (notification_id, user_id)
        SELECT notification_id, u.id 
        FROM users u 
        LEFT JOIN seller_profiles sp ON u.id = sp.user_id
        WHERE u.deleted_at IS NULL AND sp.user_id IS NULL;
        
      WHEN 'sellers' THEN
        INSERT INTO notification_recipients (notification_id, user_id)
        SELECT notification_id, u.id 
        FROM users u 
        INNER JOIN seller_profiles sp ON u.id = sp.user_id
        WHERE u.deleted_at IS NULL AND sp.is_active = true;
        
      WHEN 'admins' THEN
        INSERT INTO notification_recipients (notification_id, user_id)
        SELECT notification_id, id 
        FROM users 
        WHERE role = 'admin' AND deleted_at IS NULL;
        
      ELSE
        RAISE EXCEPTION 'Groupe d''utilisateurs non reconnu: %', user_group;
    END CASE;
    
    GET DIAGNOSTICS affected_users = ROW_COUNT;
  END IF;

  -- Mettre à jour le compteur de la notification
  UPDATE notifications 
  SET metadata = json_build_object('recipient_count', affected_users)
  WHERE id = notification_id;

  -- Journaliser l'envoi en masse
  INSERT INTO audit_logs (
    action,
    resource_type,
    resource_id,
    details,
    created_at
  ) VALUES (
    'BULK_NOTIFICATION_SENT',
    'notification',
    notification_id,
    json_build_object(
      'title', notification_title,
      'user_group', user_group,
      'affected_users', affected_users,
      'priority', priority
    ),
    NOW()
  );

  bulk_result := json_build_object(
    'success', true,
    'notification_id', notification_id,
    'affected_users', affected_users,
    'message', 'Notification envoyée à ' || affected_users || ' utilisateurs'
  );

  RETURN bulk_result;

EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO error_logs (
      function_name,
      error_message,
      details,
      created_at
    ) VALUES (
      'send_bulk_notification',
      SQLERRM,
      json_build_object(
        'notification_title', notification_title,
        'user_group', user_group
      ),
      NOW()
    );
    
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;
