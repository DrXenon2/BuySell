terraform {
  backend "s3" {
    bucket         = "buysell-platform-terraform-state"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "buysell-platform-terraform-locks"
  }
}
