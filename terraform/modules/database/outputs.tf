# Database Connection Outputs
output "database_endpoint" {
  description = "Database endpoint (hostname:port)"
  value       = "${aws_db_instance.primary.address}:${aws_db_instance.primary.port}"
}

output "database_host" {
  description = "Database hostname"
  value       = aws_db_instance.primary.address
}

output "database_port" {
  description = "Database port"
  value       = aws_db_instance.primary.port
}

output "database_name" {
  description = "Database name"
  value       = aws_db_instance.primary.db_name
}

output "database_username" {
  description = "Database username"
  value       = aws_db_instance.primary.username
  sensitive   = true
}

# Database Instance Outputs
output "database_instance_id" {
  description = "Database instance ID"
  value       = aws_db_instance.primary.identifier
}

output "database_instance_arn" {
  description = "Database instance ARN"
  value       = aws_db_instance.primary.arn
}

output "database_instance_class" {
  description = "Database instance class"
  value       = aws_db_instance.primary.instance_class
}

# Security Outputs
output "database_security_group_id" {
  description = "Database security group ID"
  value       = aws_security_group.database_sg.id
}

output "database_subnet_group_id" {
  description = "Database subnet group ID"
  value       = aws_db_subnet_group.main.id
}

output "database_subnet_group_name" {
  description = "Database subnet group name"
  value       = aws_db_subnet_group.main.name
}

# Secrets Outputs
output "database_secret_arn" {
  description = "Database secrets ARN"
  value       = aws_secretsmanager_secret.database_credentials.arn
}

output "database_secret_name" {
  description = "Database secrets name"
  value       = aws_secretsmanager_secret.database_credentials.name
}

# Connection URLs (for different applications)
output "database_url" {
  description = "Full database connection URL"
  value       = "postgresql://${aws_db_instance.primary.username}:${var.database_password}@${aws_db_instance.primary.address}:${aws_db_instance.primary.port}/${aws_db_instance.primary.db_name}"
  sensitive   = true
}

output "database_url_encoded" {
  description = "URL encoded database connection string"
  value       = "postgresql://${urlencode(aws_db_instance.primary.username)}:${urlencode(var.database_password)}@${aws_db_instance.primary.address}:${aws_db_instance.primary.port}/${aws_db_instance.primary.db_name}"
  sensitive   = true
}

# Read Replica Outputs
output "read_replica_endpoint" {
  description = "Read replica endpoint (if created)"
  value       = var.create_read_replica ? "${aws_db_instance.read_replica[0].address}:${aws_db_instance.read_replica[0].port}" : null
}

output "read_replica_host" {
  description = "Read replica hostname (if created)"
  value       = var.create_read_replica ? aws_db_instance.read_replica[0].address : null
}

# Monitoring Outputs
output "monitoring_role_arn" {
  description = "RDS monitoring role ARN"
  value       = aws_iam_role.rds_monitoring.arn
}

# CloudWatch Alarms
output "cpu_alarm_arn" {
  description = "CPU utilization alarm ARN"
  value       = aws_cloudwatch_metric_alarm.database_cpu.arn
}

output "storage_alarm_arn" {
  description = "Storage alarm ARN"
  value       = aws_cloudwatch_metric_alarm.database_storage.arn
}

output "connections_alarm_arn" {
  description = "Connections alarm ARN"
  value       = aws_cloudwatch_metric_alarm.database_connections.arn
}

# Resource Identifiers
output "resource_identifiers" {
  description = "Map of all resource identifiers"
  value = {
    instance_id     = aws_db_instance.primary.identifier
    instance_arn    = aws_db_instance.primary.arn
    security_group  = aws_security_group.database_sg.id
    subnet_group    = aws_db_subnet_group.main.name
    parameter_group = aws_db_parameter_group.main.name
    secret_arn      = aws_secretsmanager_secret.database_credentials.arn
  }
}
