# ALB Outputs
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

# Target Group Outputs
output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.main.arn
}

# ECS Outputs
output "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_id" {
  description = "ID of the ECS service"
  value       = aws_ecs_service.main.id
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.main.name
}

output "ecs_task_definition_arn" {
  description = "ARN of the ECS task definition"
  value       = aws_ecs_task_definition.main.arn
}

# Security Groups Outputs
output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb_sg.id
}

output "ecs_security_group_id" {
  description = "ID of the ECS security group"
  value       = aws_security_group.ecs_sg.id
}

# IAM Roles Outputs
output "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  value       = aws_iam_role.ecs_task_execution_role.arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  value       = aws_iam_role.ecs_task_role.arn
}

# CloudWatch Outputs
output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.ecs.name
}

# Auto Scaling Outputs
output "autoscaling_target_id" {
  description = "ID of the auto scaling target"
  value       = aws_appautoscaling_target.ecs_target.resource_id
}

# Service URL
output "service_url" {
  description = "URL to access the service"
  value       = var.create_route53_record ? "https://${var.domain_name}" : "http://${aws_lb.main.dns_name}"
}

# Full URLs for different endpoints
output "frontend_url" {
  description = "URL for the frontend application"
  value       = var.create_route53_record ? "https://${var.domain_name}" : "http://${aws_lb.main.dns_name}"
}

output "backend_url" {
  description = "URL for the backend API"
  value       = var.create_route53_record ? "https://api.${var.domain_name}" : "http://${aws_lb.main.dns_name}/api"
}

output "health_check_url" {
  description = "URL for health checks"
  value       = var.create_route53_record ? "https://${var.domain_name}/health" : "http://${aws_lb.main.dns_name}/health"
}
