-- Fonction pour gérer les nouveaux utilisateurs après inscription
-- Crée automatiquement le profil et les settings utilisateur

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  username_text TEXT;
  profile_avatar TEXT;
BEGIN
  -- Générer un username à partir de l'email si non fourni
  username_text := COALESCE(
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1) || '_' || SUBSTRING(REPLACE(CAST(gen_random_uuid() AS TEXT), '-', ''), 1, 8)
  );
  
  -- Avatar par défaut basé sur le genre ou neutre
  profile_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    CASE 
      WHEN NEW.raw_user_meta_data->>'gender' = 'female' THEN '/images/avatars/female-default.png'
      WHEN NEW.raw_user_meta_data->>'gender' = 'male' THEN '/images/avatars/male-default.png'
      ELSE '/images/avatars/default.png'
    END
  );

  -- Insérer le profil utilisateur
  INSERT INTO public.profiles (
    user_id,
    username,
    first_name,
    last_name,
    phone,
    avatar_url,
    date_of_birth,
    gender,
    bio,
    company_name,
    website,
    location,
    language,
    currency,
    email_verified,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    username_text,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone',
    profile_avatar,
    (NEW.raw_user_meta_data->>'date_of_birth')::DATE,
    NEW.raw_user_meta_data->>'gender',
    NEW.raw_user_meta_data->>'bio',
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'website',
    NEW.raw_user_meta_data->>'location',
    COALESCE(NEW.raw_user_meta_data->>'language', 'fr'),
    COALESCE(NEW.raw_user_meta_data->>'currency', 'XOF'),
    NEW.email_confirmed_at IS NOT NULL,
    NOW(),
    NOW()
  );

  -- Créer les settings par défaut pour l'utilisateur
  INSERT INTO public.user_settings (
    user_id,
    email_notifications,
    sms_notifications,
    push_notifications,
    newsletter_subscribed,
    two_factor_enabled,
    privacy_level,
    theme,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    true,    -- email_notifications
    false,   -- sms_notifications
    true,    -- push_notifications
    true,    -- newsletter_subscribed
    false,   -- two_factor_enabled
    'public', -- privacy_level
    'light', -- theme
    NOW(),
    NOW()
  );

  -- Si c'est un vendeur, créer l'entrée seller_profile
  IF NEW.raw_user_meta_data->>'role' = 'seller' THEN
    INSERT INTO public.seller_profiles (
      user_id,
      store_name,
      store_slug,
      store_description,
      store_logo,
      store_banner,
      store_address,
      store_phone,
      store_email,
      business_type,
      tax_number,
      bank_account,
      payment_methods,
      delivery_options,
      rating,
      total_sales,
      is_verified,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'store_name', 'Ma Boutique'),
      LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'store_name', 'ma-boutique'), ' ', '-')),
      NEW.raw_user_meta_data->>'store_description',
      NEW.raw_user_meta_data->>'store_logo',
      NEW.raw_user_meta_data->>'store_banner',
      NEW.raw_user_meta_data->>'store_address',
      NEW.raw_user_meta_data->>'store_phone',
      NEW.raw_user_meta_data->>'store_email',
      NEW.raw_user_meta_data->>'business_type',
      NEW.raw_user_meta_data->>'tax_number',
      NEW.raw_user_meta_data->>'bank_account',
      ARRAY['bank_transfer', 'mobile_money']::TEXT[],
      ARRAY['home_delivery', 'store_pickup']::TEXT[],
      0.0,     -- rating initial
      0,       -- total_sales initial
      false,   -- is_verified
      true,    -- is_active
      NOW(),
      NOW()
    );
  END IF;

  -- Journaliser la création du compte
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
    'USER_REGISTERED',
    'user',
    NEW.id,
    json_build_object(
      'email', NEW.email,
      'provider', NEW.raw_app_meta_data->>'provider',
      'role', COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
    ),
    NEW.raw_user_meta_data->>'registration_ip',
    NEW.raw_user_meta_data->>'user_agent',
    NOW()
  );

  -- Envoyer une notification de bienvenue
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
    'WELCOME',
    'Bienvenue sur BuySell Platform! 🎉',
    'Votre compte a été créé avec succès. Commencez à explorer notre marketplace.',
    '/dashboard',
    'Explorer',
    'low',
    NOW()
  );

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
      'handle_new_user',
      SQLERRM,
      NEW.id,
      json_build_object(
        'email', NEW.email,
        'metadata', NEW.raw_user_meta_data
      ),
      NOW()
    );
    RAISE EXCEPTION 'Erreur lors de la création du profil: %', SQLERRM;
END;
$$;

-- Créer le trigger qui s'exécute après l'insertion d'un nouvel utilisateur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
