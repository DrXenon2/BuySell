# Module Database - Main Configuration
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Security Group for Database
resource "aws_security_group" "database_sg" {
  name_prefix = "${var.project_name}-db-"
  description = "Security group for database cluster"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from ECS"
    from_port       = var.database_port
    to_port         = var.database_port
    protocol        = "tcp"
    security_groups = var.allowed_security_group_ids
  }

  ingress {
    description = "PostgreSQL from specific CIDRs"
    from_port   = var.database_port
    to_port     = var.database_port
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-db-sg"
  })
}

# Database Subnet Group
resource "aws_db_subnet_group" "main" {
  name_prefix = "${var.project_name}-"
  subnet_ids  = var.database_subnet_ids

  tags = merge(var.tags, {
    Name = "${var.project_name}-subnet-group"
  })
}

# Database Parameter Group
resource "aws_db_parameter_group" "main" {
  name_prefix = "${var.project_name}-"
  family      = var.parameter_group_family

  dynamic "parameter" {
    for_each = var.database_parameters
    content {
      name  = parameter.key
      value = parameter.value
    }
  }

  tags = var.tags
}

# RDS Database Instance (Primary)
resource "aws_db_instance" "primary" {
  identifier = "${var.project_name}-db"

  # Engine Configuration
  engine                     = var.database_engine
  engine_version             = var.database_engine_version
  instance_class             = var.database_instance_class
  allocated_storage          = var.allocated_storage
  max_allocated_storage      = var.max_allocated_storage
  storage_type               = var.storage_type
  storage_encrypted          = var.storage_encrypted
  kms_key_id                 = var.kms_key_id

  # Database Configuration
  db_name                     = var.database_name
  username                    = var.database_username
  password                    = var.database_password
  port                        = var.database_port
  multi_az                    = var.multi_az
  publicly_accessible         = false
  db_subnet_group_name        = aws_db_subnet_group.main.name
  parameter_group_name        = aws_db_parameter_group.main.name
  vpc_security_group_ids      = [aws_security_group.database_sg.id]

  # Backup & Maintenance
  backup_retention_period     = var.backup_retention_period
  backup_window               = var.backup_window
  maintenance_window          = var.maintenance_window
  auto_minor_version_upgrade  = var.auto_minor_version_upgrade

  # Monitoring
  performance_insights_enabled = var.performance_insights_enabled
  monitoring_interval          = var.monitoring_interval
  monitoring_role_arn          = aws_iam_role.rds_monitoring.arn

  # Deletion Protection
  deletion_protection        = var.deletion_protection
  skip_final_snapshot        = var.skip_final_snapshot
  final_snapshot_identifier  = var.skip_final_snapshot ? null : "${var.project_name}-final-snapshot"

  # Performance
  iops                       = var.iops
  ca_cert_identifier         = var.ca_cert_identifier

  tags = merge(var.tags, {
    Name = "${var.project_name}-primary"
  })

  lifecycle {
    ignore_changes = [
      password,
      latest_restorable_time
    ]
  }
}

# Read Replica (optional)
resource "aws_db_instance" "read_replica" {
  count = var.create_read_replica ? 1 : 0

  identifier = "${var.project_name}-db-replica"

  # Replica Configuration
  replicate_source_db = aws_db_instance.primary.identifier
  instance_class      = var.read_replica_instance_class

  # Storage
  storage_type          = var.storage_type
  storage_encrypted     = var.storage_encrypted
  kms_key_id           = var.kms_key_id

  # Network
  publicly_accessible   = false
  vpc_security_group_ids = [aws_security_group.database_sg.id]

  # Monitoring
  performance_insights_enabled = var.performance_insights_enabled
  monitoring_interval          = var.monitoring_interval
  monitoring_role_arn          = aws_iam_role.rds_monitoring.arn

  # Backup (replicas don't inherit backup settings)
  backup_retention_period = 0
  skip_final_snapshot     = true

  tags = merge(var.tags, {
    Name = "${var.project_name}-read-replica"
  })
}

# IAM Role for Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name_prefix = "${var.project_name}-rds-monitoring-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Database Secrets in AWS Secrets Manager
resource "aws_secretsmanager_secret" "database_credentials" {
  name = "${var.project_name}/database-credentials"
  description = "Database credentials for ${var.project_name}"

  recovery_window_in_days = var.secrets_recovery_window

  tags = merge(var.tags, {
    Name = "${var.project_name}-db-secret"
  })
}

resource "aws_secretsmanager_secret_version" "database_credentials" {
  secret_id = aws_secretsmanager_secret.database_credentials.id
  secret_string = jsonencode({
    username             = aws_db_instance.primary.username
    password             = var.database_password
    engine               = aws_db_instance.primary.engine
    host                 = aws_db_instance.primary.address
    port                 = aws_db_instance.primary.port
    dbname               = aws_db_instance.primary.db_name
    dbInstanceIdentifier = aws_db_instance.primary.identifier
  })
}

# CloudWatch Alarm for CPU Utilization
resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  alarm_name          = "${var.project_name}-db-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.cpu_utilization_threshold
  alarm_description   = "Database CPU utilization is too high"
  alarm_actions       = var.alarm_actions

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.identifier
  }

  tags = var.tags
}

# CloudWatch Alarm for Free Storage Space
resource "aws_cloudwatch_metric_alarm" "database_storage" {
  alarm_name          = "${var.project_name}-db-free-storage"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.free_storage_threshold
  alarm_description   = "Database free storage space is too low"
  alarm_actions       = var.alarm_actions

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.identifier
  }

  tags = var.tags
}

# CloudWatch Alarm for Database Connections
resource "aws_cloudwatch_metric_alarm" "database_connections" {
  alarm_name          = "${var.project_name}-db-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.database_connections_threshold
  alarm_description   = "Database connections are too high"
  alarm_actions       = var.alarm_actions

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.identifier
  }

  tags = var.tags
}

# RDS Event Subscription
resource "aws_db_event_subscription" "main" {
  count = var.create_event_subscription ? 1 : 0

  name      = "${var.project_name}-events"
  sns_topic = var.sns_topic_arn

  source_type = "db-instance"
  source_ids  = [aws_db_instance.primary.id]

  event_categories = [
    "availability",
    "deletion",
    "failover",
    "failure",
    "maintenance",
    "notification",
    "recovery",
    "configuration change"
  ]

  tags = var.tags
}
