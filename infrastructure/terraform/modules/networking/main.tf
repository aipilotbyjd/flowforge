resource "aws_vpc" "flowforge" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "flowforge-${var.environment}"
    Environment = var.environment
    Project     = "flowforge"
  }
}

resource "aws_internet_gateway" "flowforge" {
  vpc_id = aws_vpc.flowforge.id

  tags = {
    Name        = "flowforge-igw-${var.environment}"
    Environment = var.environment
    Project     = "flowforge"
  }
}

resource "aws_route_table" "flowforge_public" {
  vpc_id = aws_vpc.flowforge.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.flowforge.id
  }

  tags = {
    Name        = "flowforge-public-rt-${var.environment}"
    Environment = var.environment
    Project     = "flowforge"
  }
}

resource "aws_subnet" "flowforge_public" {
  count = length(var.public_subnets)

  vpc_id                  = aws_vpc.flowforge.id
  cidr_block              = var.public_subnets[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name                                              = "flowforge-public-${count.index + 1}-${var.environment}"
    Environment                                       = var.environment
    Project                                           = "flowforge"
    "kubernetes.io/role/elb"                         = "1"
    "kubernetes.io/cluster/flowforge-${var.environment}" = "owned"
  }
}

resource "aws_subnet" "flowforge_private" {
  count = length(var.private_subnets)

  vpc_id            = aws_vpc.flowforge.id
  cidr_block        = var.private_subnets[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name                                              = "flowforge-private-${count.index + 1}-${var.environment}"
    Environment                                       = var.environment
    Project                                           = "flowforge"
    "kubernetes.io/role/internal-elb"                = "1"
    "kubernetes.io/cluster/flowforge-${var.environment}" = "owned"
  }
}

resource "aws_route_table_association" "flowforge_public" {
  count = length(var.public_subnets)

  subnet_id      = aws_subnet.flowforge_public[count.index].id
  route_table_id = aws_route_table.flowforge_public.id
}

# NAT Gateway for private subnets
resource "aws_eip" "flowforge_nat" {
  count = length(var.private_subnets)

  vpc = true

  tags = {
    Name        = "flowforge-nat-eip-${count.index + 1}-${var.environment}"
    Environment = var.environment
    Project     = "flowforge"
  }
}

resource "aws_nat_gateway" "flowforge" {
  count = length(var.private_subnets)

  allocation_id = aws_eip.flowforge_nat[count.index].id
  subnet_id     = aws_subnet.flowforge_public[count.index].id

  tags = {
    Name        = "flowforge-nat-${count.index + 1}-${var.environment}"
    Environment = var.environment
    Project     = "flowforge"
  }

  depends_on = [aws_internet_gateway.flowforge]
}

resource "aws_route_table" "flowforge_private" {
  count = length(var.private_subnets)

  vpc_id = aws_vpc.flowforge.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.flowforge[count.index].id
  }

  tags = {
    Name        = "flowforge-private-rt-${count.index + 1}-${var.environment}"
    Environment = var.environment
    Project     = "flowforge"
  }
}

resource "aws_route_table_association" "flowforge_private" {
  count = length(var.private_subnets)

  subnet_id      = aws_subnet.flowforge_private[count.index].id
  route_table_id = aws_route_table.flowforge_private[count.index].id
}
