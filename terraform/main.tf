# Local values
locals {
  name_prefix = "${var.project_name}-${var.environment}"
  
  common_tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  )
  
  # Database password - in production, use AWS Secrets Manager
  database_password = var.environment == "prod" ? random_password.database.result : "dev_password_123"
}

# Random resources
resource "random_password" "database" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "random_password" "redis" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Network module
module "network" {
  source = "./modules/network"

  project_name          = var.project_name
  environment           = var.environment
  vpc_cidr              = var.vpc_cidr
  availability_zones    = var.availability_zones
  public_subnet_cidrs   = var.public_subnet_cidrs
  private_subnet_cidrs  = var.private_subnet_cidrs
  database_subnet_cidrs = var.database_subnet_cidrs
  tags                  = local.common_tags
}

# Security module
module "security" {
  source = "./modules/security"

  project_name        = var.project_name
  environment         = var.environment
  vpc_id              = module.network.vpc_id
  vpc_cidr            = var.vpc_cidr
  allowed_ips         = var.allowed_ips
  enable_ssh_access   = var.enable_ssh_access
  app_port            = var.app_port
  api_port            = var.api_port
  database_port       = var.database_port
  redis_port          = var.redis_port
  tags                = local.common_tags
}

# Database module
module "database" {
  source = "./modules/database"

  project_name                    = var.project_name
  environment                     = var.environment
  vpc_id                          = module.network.vpc_id
  database_subnet_group_name      = module.network.database_subnet_group_name
  database_security_group_id      = module.security.database_security_group_id
  database_instance_class         = var.database_instance_class
  database_engine                 = var.database_engine
  database_engine_version         = var.database_engine_version
  database_name                   = var.database_name
  database_username               = var.database_username
  database_password               = local.database_password
  database_port                   = var.database_port
  database_backup_retention_period = var.database_backup_retention_period
  database_backup_window          = var.database_backup_window
  database_maintenance_window     = var.database_maintenance_window
  tags                            = local.common_tags
}

# Redis module
module "redis" {
  source = "./modules/database" # Reusing database module for Redis

  project_name              = var.project_name
  environment               = var.environment
  vpc_id                    = module.network.vpc_id
  database_subnet_group_name = module.network.database_subnet_group_name
  database_security_group_id = module.security.redis_security_group_id
  create_postgresql         = false
  create_redis              = true
  redis_node_type           = var.redis_node_type
  redis_engine_version      = var.redis_engine_version
  redis_parameter_group_name = var.redis_parameter_group_name
  redis_port                = var.redis_port
  redis_password            = random_password.redis.result
  tags                      = local.common_tags
}

# Storage module
module "storage" {
  source = "./modules/storage"

  project_name = var.project_name
  environment  = var.environment
  tags         = local.common_tags
}

# Compute module
module "compute" {
  source = "./modules/compute"

  project_name               = var.project_name
  environment                = var.environment
  vpc_id                     = module.network.vpc_id
  public_subnet_ids          = module.network.public_subnet_ids
  private_subnet_ids         = module.network.private_subnet_ids
  app_security_group_id      = module.security.app_security_group_id
  lb_security_group_id       = module.security.lb_security_group_id
  ec2_instance_type          = var.ec2_instance_type
  ec2_key_name               = var.ec2_key_name
  ec2_volume_size            = var.ec2_volume_size
  ec2_volume_type            = var.ec2_volume_type
  min_size                   = var.min_size
  max_size                   = var.max_size
  desired_capacity           = var.desired_capacity
  app_port                   = var.app_port
  api_port                   = var.api_port
  domain_name                = var.domain_name
  acm_certificate_arn        = var.acm_certificate_arn
  database_endpoint          = module.database.database_endpoint
  database_name              = var.database_name
  database_username          = var.database_username
  database_password          = local.database_password
  redis_endpoint             = module.redis.redis_endpoint
  redis_password             = random_password.redis.result
  enable_monitoring          = var.enable_monitoring
  tags                       = local.common_tags

  depends_on = [
    module.database,
    module.redis,
    module.storage
  ]
}

# Monitoring (if enabled)
module "monitoring" {
  count = var.enable_monitoring ? 1 : 0
  source = "./modules/monitoring"

  project_name        = var.project_name
  environment         = var.environment
  alb_arn             = module.compute.alb_arn
  rds_instance_id     = module.database.database_instance_id
  redis_cluster_id    = module.redis.redis_cluster_id
  asg_name            = module.compute.asg_name
  sns_topic_arn       = var.monitoring_sns_topic
  tags                = local.common_tags
}
