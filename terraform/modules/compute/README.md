# Compute Module

This Terraform module deploys a complete compute infrastructure for the Buy-Sell Platform on AWS using ECS Fargate.

## Features

- 🚀 ECS Fargate cluster with auto-scaling
- 🔒 Application Load Balancer with HTTPS redirect
- 🛡️ Security groups for ALB and ECS tasks
- 📊 CloudWatch logging and monitoring
- 🔄 Auto-scaling based on CPU and memory utilization
- 🔐 IAM roles for ECS tasks
- 🌐 Optional Route53 DNS configuration

## Usage

```hcl
module "compute" {
  source = "./modules/compute"

  # Project Configuration
  project_name = "buy-sell-platform"
  environment  = "prod"
  region       = "us-east-1"

  # Network Configuration
  vpc_id             = module.networking.vpc_id
  public_subnet_ids  = module.networking.public_subnets
  private_subnet_ids = module.networking.private_subnets

  # Container Configuration
  container_image = "123456789012.dkr.ecr.us-east-1.amazonaws.com/buy-sell-platform:latest"
  container_port  = 3000
  cpu            = 1024
  memory         = 2048

  container_environment = {
    NODE_ENV = "production"
    API_URL  = "https://api.example.com"
  }

  container_secrets = {
    DATABASE_URL = "arn:aws:secretsmanager:us-east-1:123456789012:secret:database-url"
    JWT_SECRET   = "arn:aws:secretsmanager:us-east-1:123456789012:secret:jwt-secret"
  }

  # Scaling Configuration
  desired_count = 2
  min_capacity  = 2
  max_capacity  = 10

  # DNS Configuration
  create_route53_record = true
  route53_zone_id      = "Z123456789012"
  domain_name          = "app.example.com"
  acm_certificate_arn  = "arn:aws:acm:us-east-1:123456789012:certificate/abc123"

  tags = {
    Project     = "buy-sell-platform"
    Environment = "prod"
    Terraform   = "true"
  }
}
