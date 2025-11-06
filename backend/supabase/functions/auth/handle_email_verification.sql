-- Fonction pour gérer la vérification d'email
-- Met à jour le profil et envoie des notifications

CREATE OR REPLACE FUNCTION handle_email_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier si l'email vient d'être vérifié
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    -- Mettre à jour le profil utilisateur
    UPDATE public.profiles 
    SET 
      email_verified = true,
      updated_at = NOW()
    WHERE user_id = NEW.id;

    -- Journaliser la vérification d'email
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
      'EMAIL_VERIFIED',
      'user',
      NEW.id,
      json_build_object(
        'email', NEW.email,
        'verified_at', NEW.email_confirmed_at
      ),
      NULL, -- L'adresse IP n'est pas disponible dans ce contexte
      NULL, -- User agent non disponible
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
      'EMAIL_VERIFIED',
      'Email vérifié avec succès! ✅',
      'Votre adresse email a été vérifiée. Vous pouvez maintenant utiliser toutes les fonctionnalités de la plateforme.',
      '/dashboard',
      'Accéder au tableau de bord',
      'medium',
      NOW()
    );

    -- Si l'utilisateur est un vendeur, mettre à jour le statut de vérification
    UPDATE public.seller_profiles 
    SET 
      is_verified = true,
      updated_at = NOW()
    WHERE user_id = NEW.id AND is_verified = false;

    -- Créer un événement d'analytique
    INSERT INTO public.analytics_events (
      user_id,
      event_type,
      event_name,
      details,
      created_at
    ) VALUES (
      NEW.id,
      'authentication',
      'email_verified',
      json_build_object(
        'method', 'email',
        'provider', COALESCE(NEW.raw_app_meta_data->>'provider', 'email')
      ),
      NOW()
    );
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
      'handle_email_verification',
      SQLERRM,
      NEW.id,
      json_build_object(
        'email', NEW.email,
        'email_confirmed_at', NEW.email_confirmed_at
      ),
      NOW()
    );
    RAISE EXCEPTION 'Erreur lors de la gestion de la vérification d''email: %', SQLERRM;
END;
$$;

-- Trigger pour la vérification d'email
DROP TRIGGER IF EXISTS on_email_verification ON auth.users;

CREATE TRIGGER on_email_verification
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_email_verification();
