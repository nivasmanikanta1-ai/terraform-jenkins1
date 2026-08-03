terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = "eu-west-2"
}

# Create a VPC
resource "aws_instance" "web_server" {
  ami           = "ami-054818ecdf7d5ec33" # Replace with the desired AMI ID
  instance_type = var.ec2_instance_type
  tags = {
    Name = "web-server"
  }
}
