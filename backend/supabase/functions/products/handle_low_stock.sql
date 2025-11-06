-- Fonction pour gérer les alertes de stock faible
-- Notifie les vendeurs quand le stock est bas

CREATE OR REPLACE FUNCTION handle_low_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  low_stock_threshold INTEGER := 10;
  critical_stock_threshold INTEGER := 3;
BEGIN
  -- Vérifier si le stock est devenu faible
  IF NEW.track_quantity = true AND NEW.quantity IS NOT NULL AND OLD.quantity IS NOT NULL THEN
    -- Stock faible
    IF NEW.quantity <= low_stock_threshold AND OLD.quantity > low_stock_threshold THEN
      -- Notifier le vendeur
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        action_url,
        action_label,
        priority,
        created_at
      ) VALUES (
        NEW.user_id,
        'LOW_STOCK_ALERT',
        'Stock faible ⚠️',
        'Le produit "' || NEW.name || '" a un stock faible (' || NEW.quantity || ' unités restantes).',
        '/seller/products/' || NEW.id || '/edit',
        'Gérer le stock',
        'medium',
        NOW()
      );

      -- Journaliser l'alerte
      INSERT INTO audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        created_at
      ) VALUES (
        NEW.user_id,
        'LOW_STOCK_ALERT',
        'product',
        NEW.id,
        json_build_object(
          'product_name', NEW.name,
          'current_stock', NEW.quantity,
          'threshold', low_stock_threshold
        ),
        NOW()
      );
    END IF;

    -- Stock critique
    IF NEW.quantity <= critical_stock_threshold AND OLD.quantity > critical_stock_threshold THEN
      -- Notifier le vendeur avec priorité haute
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        action_url,
        action_label,
        priority,
        created_at
      ) VALUES (
        NEW.user_id,
        'CRITICAL_STOCK_ALERT',
        'Stock critique! 🚨',
        'Le produit "' || NEW.name || '" a un stock critique (' || NEW.quantity || ' unités restantes). Réapprovisionnez rapidement!',
        '/seller/products/' || NEW.id || '/edit',
        'Réapprovisionner',
        'high',
        NOW()
      );

      -- Envoyer un email d'alerte (simulé)
      INSERT INTO email_queue (
        recipient_email,
        subject,
        template_name,
        template_data,
        priority,
        created_at
      ) VALUES (
        (SELECT email FROM users WHERE id = NEW.user_id),
        'Alerte stock critique - ' || NEW.name,
        'critical_stock_alert',
        json_build_object(
          'product_name', NEW.name,
          'current_stock', NEW.quantity,
          'product_url', '/seller/products/' || NEW.id
        ),
        'high',
        NOW()
      );
    END IF;

    -- Stock épuisé
    IF NEW.quantity = 0 AND OLD.quantity > 0 THEN
      -- Désactiver automatiquement le produit si configuré
      IF (NEW.metadata->>'auto_disable_when_out_of_stock')::BOOLEAN THEN
        UPDATE products 
        SET is_available = false 
        WHERE id = NEW.id;
      END IF;

      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        action_url,
        action_label,
        priority,
        created_at
      ) VALUES (
        NEW.user_id,
        'OUT_OF_STOCK',
        'Stock épuisé 📦',
        'Le produit "' || NEW.name || '" est en rupture de stock.',
        '/seller/products/' || NEW.id || '/edit',
        'Gérer le stock',
        'high',
        NOW()
      );
    END IF;

    -- Stock réapprovisionné
    IF NEW.quantity > 0 AND OLD.quantity = 0 THEN
      -- Réactiver le produit si nécessaire
      IF NOT NEW.is_available THEN
        UPDATE products 
        SET is_available = true 
        WHERE id = NEW.id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO error_logs (
      function_name,
      error_message,
      user_id,
      details,
      created_at
    ) VALUES (
      'handle_low_stock',
      SQLERRM,
      NEW.user_id,
      json_build_object('product_id', NEW.id),
      NOW()
    );
    RETURN NEW;
END;
$$;

-- Trigger pour surveiller les changements de stock
DROP TRIGGER IF EXISTS on_stock_change ON products;

CREATE TRIGGER on_stock_change
  AFTER UPDATE OF quantity ON products
  FOR EACH ROW
  EXECUTE FUNCTION handle_low_stock();
