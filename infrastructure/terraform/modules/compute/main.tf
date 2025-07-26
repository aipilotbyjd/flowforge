resource "aws_eks_cluster" "flowforge" {
  name     = "flowforge-${var.environment}"
  role_arn = aws_iam_role.flowforge_eks.arn
  version  = var.kubernetes_version

  vpc_config {
    subnet_ids              = concat(var.public_subnet_ids, var.private_subnet_ids)
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = var.cluster_endpoint_public_access_cidrs
  }

  encryption_config {
    provider {
      key_arn = aws_kms_key.eks.arn
    }
    resources = ["secrets"]
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  tags = {
    Name        = "flowforge-${var.environment}"
    Environment = var.environment
    Project     = "flowforge"
  }

  depends_on = [
    aws_iam_role_policy_attachment.flowforge_eks_cluster_policy,
    aws_iam_role_policy_attachment.flowforge_eks_vpc_resource_controller,
  ]
}

resource "aws_eks_node_group" "flowforge" {
  cluster_name    = aws_eks_cluster.flowforge.name
  node_group_name = "flowforge-${var.environment}"
  node_role_arn   = aws_iam_role.flowforge_node.arn
  subnet_ids      = var.private_subnet_ids

  capacity_type  = var.capacity_type
  instance_types = var.instance_types

  scaling_config {
    desired_size = var.node_desired_size
    max_size     = var.node_max_size
    min_size     = var.node_min_size
  }

  update_config {
    max_unavailable = 1
  }

  remote_access {
    ec2_ssh_key = var.key_pair_name
  }

  tags = {
    Name        = "flowforge-node-${var.environment}"
    Environment = var.environment
    Project     = "flowforge"
  }

  depends_on = [
    aws_iam_role_policy_attachment.flowforge_node_worker_policy,
    aws_iam_role_policy_attachment.flowforge_node_cni_policy,
    aws_iam_role_policy_attachment.flowforge_node_registry_policy,
  ]
}

# EKS Cluster IAM Role
resource "aws_iam_role" "flowforge_eks" {
  name = "flowforge-eks-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "flowforge-eks-role-${var.environment}"
    Environment = var.environment
    Project     = "flowforge"
  }
}

resource "aws_iam_role_policy_attachment" "flowforge_eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.flowforge_eks.name
}

resource "aws_iam_role_policy_attachment" "flowforge_eks_vpc_resource_controller" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.flowforge_eks.name
}

# EKS Node Group IAM Role
resource "aws_iam_role" "flowforge_node" {
  name = "flowforge-node-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "flowforge-node-role-${var.environment}"
    Environment = var.environment
    Project     = "flowforge"
  }
}

resource "aws_iam_role_policy_attachment" "flowforge_node_worker_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.flowforge_node.name
}

resource "aws_iam_role_policy_attachment" "flowforge_node_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.flowforge_node.name
}

resource "aws_iam_role_policy_attachment" "flowforge_node_registry_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.flowforge_node.name
}

# KMS key for EKS encryption
resource "aws_kms_key" "eks" {
  description             = "EKS Secret Encryption Key"
  deletion_window_in_days = 7

  tags = {
    Name        = "flowforge-eks-key-${var.environment}"
    Environment = var.environment
    Project     = "flowforge"
  }
}

resource "aws_kms_alias" "eks" {
  name          = "alias/flowforge-eks-${var.environment}"
  target_key_id = aws_kms_key.eks.key_id
}
