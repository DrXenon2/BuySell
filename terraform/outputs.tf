# Network outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.network.vpc_id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = module.network.public_subnet_ids
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = module.network.private_subnet_ids
}

# Database outputs
output "database_endpoint" {
  description = "Database connection endpoint"
  value       = module.database.database_endpoint
  sensitive   = true
}

output "database_port" {
  description = "Database port"
  value       = module.database.database_port
}

output "database_name" {
  description = "Database name"
  value       = module.database.database_name
}

output "database_username" {
  description = "Database username"
  value       = module.database.database_username
  sensitive   = true
}

output "database_password" {
  description = "Database password (use with caution)"
  value       = local.database_password
  sensitive   = true
}

# Redis outputs
output "redis_endpoint" {
  description = "Redis connection endpoint"
  value       = module.redis.redis_endpoint
}

output "redis_port" {
  description = "Redis port"
  value       = module.redis.redis_port
}

output "redis_password" {
  description = "Redis password (use with caution)"
  value       = random_password.redis.result
  sensitive   = true
}

# Compute outputs
output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.compute.alb_dns_name
}

output "alb_zone_id" {
  description = "ALB zone ID"
  value       = module.compute.alb_zone_id
}

output "app_url" {
  description = "Application URL"
  value       = module.compute.app_url
}

output "api_url" {
  description = "API URL"
  value       = module.compute.api_url
}

# Security outputs
output "app_security_group_id" {
  description = "Application security group ID"
  value       = module.security.app_security_group_id
}

output "database_security_group_id" {
  description = "Database security group ID"
  value       = module.security.database_security_group_id
}

# Storage outputs
output "s3_bucket_id" {
  description = "S3 bucket ID for file storage"
  value       = module.storage.s3_bucket_id
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN for file storage"
  value       = module.storage.s3_bucket_arn
}

# Monitoring outputs
output "cloudwatch_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = var.enable_monitoring ? module.monitoring[0].cloudwatch_dashboard_url : ""
}

# Important notes
output "important_notes" {
  description = "Important deployment notes"
  value       = <<EOT

🎉 BuySell Platform deployed successfully!

📋 Next Steps:
1. Update your DNS to point to the ALB: ${module.compute.alb_dns_name}
2. Configure environment variables in your application
3. Set up SSL certificates for your domain
4. Configure monitoring and alerting

🔐 Security Notes:
- Database password: ${local.database_password}
- Redis password: ${random_password.redis.result}
- Store these passwords securely using AWS Secrets Manager

🌐 Access URLs:
- Application: ${module.compute.app_url}
- API: ${module.compute.api_url}

📊 Monitoring:
- CloudWatch Dashboard: ${var.enable_monitoring ? module.monitoring[0].cloudwatch_dashboard_url : "Disabled"}

EOT
}
