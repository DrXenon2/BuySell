# Project Configuration
variable "project_name" {
  description = "Name of the project (used for resource naming)"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# Network Configuration
variable "vpc_id" {
  description = "VPC ID where database will be deployed"
  type        = string
}

variable "database_subnet_ids" {
  description = "List of subnet IDs for database subnet group"
  type        = list(string)
}

variable "allowed_security_group_ids" {
  description = "List of security group IDs allowed to access database"
  type        = list(string)
  default     = []
}

variable "allowed_cidr_blocks" {
  description = "List of CIDR blocks allowed to access database"
  type        = list(string)
  default     = []
}

# Database Configuration
variable "database_engine" {
  description = "Database engine (postgres, mysql, etc.)"
  type        = string
  default     = "postgres"
}

variable "database_engine_version" {
  description = "Database engine version"
  type        = string
  default     = "15.4"
}

variable "database_instance_class" {
  description = "Database instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "database_name" {
  description = "Name of the initial database"
  type        = string
  default     = "buyselldb"
}

variable "database_username" {
  description = "Master username for database"
  type        = string
  default     = "buyselladmin"
}

variable "database_password" {
  description = "Master password for database"
  type        = string
  sensitive   = true
}

variable "database_port" {
  description = "Port that database listens on"
  type        = number
  default     = 5432
}

# Storage Configuration
variable "allocated_storage" {
  description = "Initial allocated storage in GB"
  type        = number
  default     = 20
}

variable "max_allocated_storage" {
  description = "Maximum allocated storage in GB for autoscaling"
  type        = number
  default     = 100
}

variable "storage_type" {
  description = "Storage type (gp2, gp3, io1)"
  type        = string
  default     = "gp3"
}

variable "iops" {
  description = "Provisioned IOPS (only for io1 storage type)"
  type        = number
  default     = null
}

variable "storage_encrypted" {
  description = "Whether to encrypt storage"
  type        = bool
  default     = true
}

variable "kms_key_id" {
  description = "KMS key ID for encryption (uses default if not specified)"
  type        = string
  default     = null
}

# High Availability & Backup
variable "multi_az" {
  description = "Whether to deploy in Multi-AZ configuration"
  type        = bool
  default     = false
}

variable "backup_retention_period" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

variable "backup_window" {
  description = "Preferred backup window (UTC)"
  type        = string
  default     = "03:00-04:00"
}

variable "maintenance_window" {
  description = "Preferred maintenance window (UTC)"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

# Read Replica Configuration
variable "create_read_replica" {
  description = "Whether to create a read replica"
  type        = bool
  default     = false
}

variable "read_replica_instance_class" {
  description = "Instance class for read replica"
  type        = string
  default     = "db.t3.micro"
}

# Performance & Monitoring
variable "parameter_group_family" {
  description = "Parameter group family"
  type        = string
  default     = "postgres15"
}

variable "database_parameters" {
  description = "Additional database parameters"
  type        = map(string)
  default     = {}
}

variable "performance_insights_enabled" {
  description = "Whether to enable Performance Insights"
  type        = bool
  default     = true
}

variable "monitoring_interval" {
  description = "Enhanced monitoring interval in seconds"
  type        = number
  default     = 60
}

# Security
variable "deletion_protection" {
  description = "Whether to enable deletion protection"
  type        = bool
  default     = true
}

variable "skip_final_snapshot" {
  description = "Whether to skip final snapshot on deletion"
  type        = bool
  default     = false
}

variable "auto_minor_version_upgrade" {
  description = "Whether to allow automatic minor version upgrades"
  type        = bool
  default     = true
}

variable "ca_cert_identifier" {
  description = "CA certificate identifier"
  type        = string
  default     = "rds-ca-rsa2048-g1"
}

# Secrets Management
variable "secrets_recovery_window" {
  description = "Number of days that secrets can be recovered"
  type        = number
  default     = 7
}

# CloudWatch Alarms
variable "cpu_utilization_threshold" {
  description = "CPU utilization threshold for alarm"
  type        = number
  default     = 80
}

variable "free_storage_threshold" {
  description = "Free storage threshold in bytes for alarm"
  type        = number
  default     = 2147483648 # 2GB
}

variable "database_connections_threshold" {
  description = "Database connections threshold for alarm"
  type        = number
  default     = 100
}

variable "alarm_actions" {
  description = "List of ARNs to notify when alarms trigger"
  type        = list(string)
  default     = []
}

# Event Notifications
variable "create_event_subscription" {
  description = "Whether to create RDS event subscription"
  type        = bool
  default     = false
}

variable "sns_topic_arn" {
  description = "SNS topic ARN for event notifications"
  type        = string
  default     = null
}
