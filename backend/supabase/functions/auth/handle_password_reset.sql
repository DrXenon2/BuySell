-- Fonction pour gérer la réinitialisation du mot de passe
-- Sécurité et notifications

CREATE OR REPLACE FUNCTION handle_password_reset()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reset_token TEXT;
  user_email TEXT;
  expiry_time TIMESTAMPTZ;
BEGIN
  -- Vérifier si c'est une demande de réinitialisation (token créé)
  IF NEW.raw_app_meta_data->>'action' = 'password_reset' AND OLD.raw_app_meta_data->>'action' IS DISTINCT FROM 'password_reset' THEN
    -- Récupérer les informations
    reset_token := NEW.raw_app_meta_data->>'reset_token';
    user_email := NEW.email;
    expiry_time := (NEW.raw_app_meta_data->>'reset_token_expires')::TIMESTAMPTZ;

    -- Journaliser la demande de réinitialisation
    INSERT INTO public.audit_logs (
      user_id,
      action,
      resource_type,
      resource_id,
      details,
      ip_address,
      user_agent,
      created_at
    ) VALUES (
      NEW.id,
      'PASSWORD_RESET_REQUESTED',
      'user',
      NEW.id,
      json_build_object(
        'email', user_email,
        'token_expires', expiry_time,
        'method', 'email'
      ),
      NEW.raw_user_meta_data->>'request_ip',
      NEW.raw_user_meta_data->>'user_agent',
      NOW()
    );

    -- Envoyer une notification de sécurité
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      action_url,
      action_label,
      priority,
      created_at
    ) VALUES (
      NEW.id,
      'SECURITY_ALERT',
      'Demande de réinitialisation de mot de passe',
      'Une demande de réinitialisation de mot de passe a été effectuée pour votre compte. Si ce n''est pas vous, veuillez sécuriser votre compte immédiatement.',
      '/security',
      'Vérifier la sécurité',
      'high',
      NOW()
    );

    -- Créer un événement d'analytique pour le suivi
    INSERT INTO public.analytics_events (
      user_id,
      event_type,
      event_name,
      details,
      created_at
    ) VALUES (
      NEW.id,
      'authentication',
      'password_reset_requested',
      json_build_object(
        'method', 'email',
        'ip_address', NEW.raw_user_meta_data->>'request_ip'
      ),
      NOW()
    );
  END IF;

  -- Vérifier si le mot de passe a été changé
  IF NEW.encrypted_password IS DISTINCT FROM OLD.encrypted_password THEN
    -- Journaliser le changement de mot de passe
    INSERT INTO public.audit_logs (
      user_id,
      action,
      resource_type,
      resource_id,
      details,
      ip_address,
      user_agent,
      created_at
    ) VALUES (
      NEW.id,
      'PASSWORD_CHANGED',
      'user',
      NEW.id,
      json_build_object(
        'email', NEW.email,
        'change_type', CASE 
          WHEN OLD.encrypted_password IS NULL THEN 'initial_setup'
          WHEN NEW.raw_app_meta_data->>'action' = 'password_reset' THEN 'reset'
          ELSE 'manual_change'
        END
      ),
      NEW.raw_user_meta_data->>'change_ip',
      NEW.raw_user_meta_data->>'user_agent',
      NOW()
    );

    -- Envoyer une notification de confirmation
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      action_url,
      action_label,
      priority,
      created_at
    ) VALUES (
      NEW.id,
      'SECURITY_ALERT',
      'Mot de passe modifié',
      'Le mot de passe de votre compte a été modifié avec succès. Si vous n''êtes pas à l''origine de cette modification, veuillez nous contacter immédiatement.',
      '/security',
      'Vérifier la sécurité',
      'high',
      NOW()
    );

    -- Nettoyer les tokens de réinitialisation
    UPDATE auth.users 
    SET raw_app_meta_data = raw_app_meta_data - 'reset_token' - 'reset_token_expires' - 'action'
    WHERE id = NEW.id;

    -- Mettre à jour la date de modification du mot de passe dans le profil
    UPDATE public.profiles 
    SET 
      last_password_change = NOW(),
      updated_at = NOW()
    WHERE user_id = NEW.id;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Journaliser l'erreur
    INSERT INTO public.error_logs (
      function_name,
      error_message,
      user_id,
      details,
      created_at
    ) VALUES (
      'handle_password_reset',
      SQLERRM,
      NEW.id,
      json_build_object(
        'email', NEW.email,
        'action', NEW.raw_app_meta_data->>'action'
      ),
      NOW()
    );
    RAISE EXCEPTION 'Erreur lors de la gestion de la réinitialisation du mot de passe: %', SQLERRM;
END;
$$;

-- Trigger pour les changements de mot de passe
DROP TRIGGER IF EXISTS on_password_change ON auth.users;

CREATE TRIGGER on_password_change
  AFTER UPDATE OF encrypted_password, raw_app_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_password_reset();

-- Fonction utilitaire pour initier une réinitialisation de mot de passe
CREATE OR REPLACE FUNCTION request_password_reset(user_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  reset_token TEXT;
  token_expires TIMESTAMPTZ;
  result JSON;
BEGIN
  -- Vérifier que l'utilisateur existe
  SELECT * INTO user_record 
  FROM auth.users 
  WHERE email = user_email AND deleted_at IS NULL;
  
  IF NOT FOUND THEN
    -- Ne pas révéler si l'email existe ou non pour des raisons de sécurité
    RETURN json_build_object(
      'success', true,
      'message', 'Si un compte avec cet email existe, un lien de réinitialisation a été envoyé.'
    );
  END IF;

  -- Générer un token sécurisé
  reset_token := encode(gen_random_bytes(32), 'hex');
  token_expires := NOW() + INTERVAL '1 hour';

  -- Mettre à jour l'utilisateur avec le token
  UPDATE auth.users 
  SET 
    raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::JSONB) || json_build_object(
      'action', 'password_reset',
      'reset_token', reset_token,
      'reset_token_expires', token_expires
    )::JSONB,
    updated_at = NOW()
  WHERE id = user_record.id;

  -- Journaliser la demande
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    created_at
  ) VALUES (
    user_record.id,
    'PASSWORD_RESET_TOKEN_GENERATED',
    'user',
    user_record.id,
    json_build_object(
      'email', user_email,
      'token_expires', token_expires
    ),
    NOW()
  );

  -- Retourner le résultat (en production, le token serait envoyé par email)
  result := json_build_object(
    'success', true,
    'message', 'Un lien de réinitialisation a été envoyé à votre adresse email.',
    'token', reset_token, -- À supprimer en production
    'expires', token_expires
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Erreur lors de la demande de réinitialisation'
    );
END;
$$;
