#!/bin/bash

set -e

echo "🚀 Déploiement du stack de monitoring..."

# Vérification que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

# Vérification que Docker Compose est disponible
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose n'est pas disponible"
    exit 1
fi

# Création des dossiers nécessaires
mkdir -p prometheus grafana/dashboards grafana/provisioning

# Démarrage des services
echo "📦 Démarrage des services de monitoring..."
docker-compose -f docker-compose.monitoring.yml up -d

# Attente que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 30

# Vérification de l'état des services
echo "🔍 Vérification de l'état des services..."

services=("prometheus" "grafana" "node-exporter" "cadvisor" "alertmanager")
for service in "${services[@]}"; do
    if docker ps | grep -q $service; then
        echo "✅ $service est en cours d'exécution"
    else
        echo "❌ $service n'est pas démarré"
    fi
done

echo ""
echo "🎉 Stack de monitoring déployé avec succès!"
echo ""
echo "📊 Accès aux services:"
echo "   Grafana: http://localhost:3000 (admin/admin123)"
echo "   Prometheus: http://localhost:9090"
echo "   Alertmanager: http://localhost:9093"
echo "   Node Exporter: http://localhost:9100"
echo "   cAdvisor: http://localhost:8080"
echo ""
echo "💡 Pour arrêter le stack: docker-compose -f docker-compose.monitoring.yml down"
