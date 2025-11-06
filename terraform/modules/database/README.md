# Database Module

This Terraform module deploys a production-ready PostgreSQL database on AWS RDS with security, monitoring, and backup configurations.

## Features

- 🗄️ PostgreSQL RDS instance with configurable engine version
- 🔒 Security groups and network isolation
- 💾 Encrypted storage with KMS
- 📊 Enhanced monitoring and Performance Insights
- 🔄 Multi-AZ deployment for high availability
- 📖 Optional read replica for read scaling
- 🔐 Secrets management with AWS Secrets Manager
- ⚠️ CloudWatch alarms for monitoring
- 💾 Automated backups and snapshots

## Usage

```hcl
module "database" {
  source = "./modules/database"

  # Project Configuration
  project_name = "buy-sell-platform"
  environment  = "prod"

  # Network Configuration
  vpc_id              = module.networking.vpc_id
  database_subnet_ids = module.networking.database_subnets
  allowed_security_group_ids = [module.compute.ecs_security_group_id]

  # Database Configuration
  database_engine         = "postgres"
  database_engine_version = "15.4"
  database_instance_class = "db.t3.medium"
  database_name           = "buyselldb"
  database_username       = "buyselladmin"
  database_password       = var.database_password

  # Storage Configuration
  allocated_storage     = 100
  max_allocated_storage = 500
  storage_type         = "gp3"

  # High Availability
  multi_az               = true
  backup_retention_period = 14

  # Monitoring
  performance_insights_enabled = true
  monitoring_interval          = 60

  # Security
  deletion_protection = true

  # Alarms
  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Project     = "buy-sell-platform"
    Environment = "prod"
    Terraform   = "true"
  }
}
