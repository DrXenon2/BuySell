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

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# Network Configuration
variable "vpc_id" {
  description = "VPC ID where resources will be deployed"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for ALB"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for ECS tasks"
  type        = list(string)
}

# Container Configuration
variable "container_image" {
  description = "Container image to deploy"
  type        = string
}

variable "container_port" {
  description = "Port that the container listens on"
  type        = number
  default     = 3000
}

variable "cpu" {
  description = "CPU units for the ECS task (1024 = 1 vCPU)"
  type        = number
  default     = 1024
}

variable "memory" {
  description = "Memory for the ECS task (in MiB)"
  type        = number
  default     = 2048
}

variable "container_environment" {
  description = "Environment variables for the container"
  type        = map(string)
  default     = {}
}

variable "container_secrets" {
  description = "Secrets for the container (from AWS Secrets Manager)"
  type        = map(string)
  default     = {}
}

# Security Configuration
variable "ssh_allowed_cidrs" {
  description = "CIDR blocks allowed to SSH to ECS tasks"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for ALB"
  type        = bool
  default     = true
}

# Scaling Configuration
variable "desired_count" {
  description = "Number of ECS tasks to run initially"
  type        = number
  default     = 2
}

variable "min_capacity" {
  description = "Minimum number of ECS tasks"
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "Maximum number of ECS tasks"
  type        = number
  default     = 10
}

variable "cpu_utilization_target" {
  description = "Target CPU utilization for auto scaling"
  type        = number
  default     = 70
}

variable "memory_utilization_target" {
  description = "Target memory utilization for auto scaling"
  type        = number
  default     = 80
}

# Health Check Configuration
variable "health_check_path" {
  description = "Path for ALB health checks"
  type        = string
  default     = "/health"
}

variable "health_check_command" {
  description = "Health check command for container"
  type        = string
  default     = "curl -f http://localhost:3000/health || exit 1"
}

# Monitoring Configuration
variable "enable_container_insights" {
  description = "Enable Container Insights for ECS cluster"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 30
}

# SSL/TLS Configuration
variable "acm_certificate_arn" {
  description = "ARN of ACM certificate for HTTPS"
  type        = string
  default     = null
}

# DNS Configuration
variable "create_route53_record" {
  description = "Whether to create Route53 record"
  type        = bool
  default     = false
}

variable "route53_zone_id" {
  description = "Route53 zone ID for DNS record"
  type        = string
  default     = null
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = null
}
