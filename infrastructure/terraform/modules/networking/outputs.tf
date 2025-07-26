output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.flowforge.id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = aws_vpc.flowforge.cidr_block
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.flowforge_public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.flowforge_private[*].id
}

output "internet_gateway_id" {
  description = "Internet Gateway ID"
  value       = aws_internet_gateway.flowforge.id
}

output "nat_gateway_ids" {
  description = "NAT Gateway IDs"
  value       = aws_nat_gateway.flowforge[*].id
}

output "availability_zones" {
  description = "Availability zones"
  value       = var.availability_zones
}
