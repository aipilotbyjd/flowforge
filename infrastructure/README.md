# FlowForge Infrastructure as Code

This directory contains all Infrastructure as Code (IaC) configurations for the FlowForge enterprise workflow automation platform.

## Directory Structure

```
infrastructure/
├── kubernetes/                # Kubernetes manifests and configurations
│   ├── base/                  # Base Kubernetes resources
│   │   ├── namespaces/        # Namespace definitions
│   │   ├── crds/              # Custom Resource Definitions
│   │   ├── rbac/              # Role-Based Access Control
│   │   ├── storage/           # Persistent Volume configurations
│   │   └── networking/        # Services and Ingress configurations
│   ├── overlays/              # Environment-specific overlays
│   │   ├── development/       # Development environment
│   │   ├── staging/           # Staging environment
│   │   └── production/        # Production environment
│   ├── operators/             # Kubernetes operators
│   └── helm-charts/           # Custom Helm charts
├── terraform/                 # Terraform configurations
│   ├── modules/               # Reusable Terraform modules
│   │   ├── networking/        # VPC, subnets, routing
│   │   ├── compute/           # EKS cluster and node groups
│   │   ├── database/          # RDS instances
│   │   ├── storage/           # S3 buckets, EFS
│   │   ├── security/          # IAM roles, security groups
│   │   └── monitoring/        # CloudWatch, alerting
│   ├── environments/          # Environment-specific configurations
│   └── providers/             # Provider configurations
├── docker/                    # Docker configurations
│   ├── base-images/           # Base Docker images
│   ├── service-images/        # Service-specific Docker images
│   └── docker-compose/        # Docker Compose files
├── monitoring/                # Monitoring stack configurations
│   ├── prometheus/            # Prometheus configuration
│   ├── grafana/               # Grafana dashboards and datasources
│   ├── loki/                  # Loki logging configuration
│   └── tempo/                 # Tempo tracing configuration
├── ci-cd/                     # CI/CD pipeline configurations
│   ├── github-actions/        # GitHub Actions workflows
│   ├── gitlab-ci/             # GitLab CI configurations
│   └── jenkins/               # Jenkins pipeline configurations
└── scripts/                   # Infrastructure automation scripts
    ├── deploy/                # Deployment scripts
    ├── backup/                # Backup and restore scripts
    └── maintenance/           # Maintenance and cleanup scripts
```

## Getting Started

### Prerequisites

Before deploying FlowForge infrastructure, ensure you have the following tools installed:

#### Required Tools
- [kubectl](https://kubernetes.io/docs/tasks/tools/) - Kubernetes command-line tool
- [kustomize](https://kustomize.io/) - Kubernetes configuration management
- [terraform](https://www.terraform.io/) - Infrastructure as Code tool
- [docker](https://www.docker.com/) - Container platform
- [helm](https://helm.sh/) - Kubernetes package manager

#### Optional Tools
- [k9s](https://k9scli.io/) - Kubernetes cluster management
- [stern](https://github.com/stern/stern) - Multi-pod log tailing
- [kubectx](https://github.com/ahmetb/kubectx) - Kubernetes context switching

### Quick Start

#### 1. Development Environment (Docker Compose)

```bash
# Start all services locally
cd infrastructure/docker/docker-compose
docker-compose -f development.yaml up -d

# Check services status
docker-compose -f development.yaml ps

# View logs
docker-compose -f development.yaml logs -f api-gateway

# Stop services
docker-compose -f development.yaml down
```

#### 2. Kubernetes Deployment

```bash
# Deploy to development environment
cd infrastructure/scripts/deploy
./deploy-k8s.sh development

# Deploy to staging environment
./deploy-k8s.sh staging

# Deploy to production environment
./deploy-k8s.sh production

# Dry run deployment
./deploy-k8s.sh development --dry-run

# Skip post-deployment tests
./deploy-k8s.sh development --skip-tests
```

#### 3. Terraform Infrastructure

```bash
# Initialize Terraform
cd infrastructure/terraform/environments/development
terraform init

# Plan infrastructure changes
terraform plan

# Apply infrastructure changes
terraform apply

# Destroy infrastructure
terraform destroy
```

## Environment Configurations

### Development Environment

**Purpose**: Local development and testing
**Resources**: Minimal resource allocation, debug logging enabled
**Access**: Local access via port-forwarding or ingress

**Key Features**:
- Hot-reloading enabled
- Debug logging
- Persistent volumes for data
- Integrated monitoring stack

**Access URLs**:
- API Gateway: http://localhost:3000
- Grafana: http://localhost:3001
- Prometheus: http://localhost:9090

### Staging Environment

**Purpose**: Pre-production testing and validation
**Resources**: Production-like resource allocation
**Access**: Internal network access with basic authentication

**Key Features**:
- Production-like configuration
- SSL/TLS certificates
- Resource limits and requests
- Automated testing integration

### Production Environment

**Purpose**: Live production workloads
**Resources**: Full resource allocation with auto-scaling
**Access**: Public access with full security measures

**Key Features**:
- High availability (multi-AZ)
- Auto-scaling enabled
- Full monitoring and alerting
- Backup and disaster recovery
- Security hardening

## Monitoring and Observability

### Prometheus Metrics

FlowForge exposes comprehensive metrics for monitoring:

```yaml
# Application metrics
flowforge_workflow_executions_total
flowforge_workflow_execution_duration_seconds
flowforge_active_workflows
flowforge_node_executions_total
flowforge_webhook_requests_total

# System metrics
process_cpu_seconds_total
process_memory_bytes
nodejs_heap_size_bytes
```

### Grafana Dashboards

Pre-configured dashboards available:
- **FlowForge Overview**: High-level system metrics
- **Workflow Performance**: Workflow execution analytics
- **Node Performance**: Individual node performance
- **Infrastructure**: Kubernetes and system metrics
- **Application Logs**: Centralized log analysis

### Alerting Rules

Critical alerts configured:
- High error rate (>5% for 5 minutes)
- High response time (>2s for 5 minutes)
- Memory usage >80%
- CPU usage >80%
- Disk usage >85%
- Pod restart frequency

## Security Considerations

### Network Security
- Network policies for pod-to-pod communication
- Ingress with SSL/TLS termination
- Private subnets for database and internal services

### Access Control
- RBAC for service accounts
- Namespace isolation
- Secret management with encryption at rest

### Container Security
- Non-root user containers
- Security contexts and policies
- Regular base image updates
- Vulnerability scanning

## Disaster Recovery

### Backup Strategy
- Database backups every 6 hours
- Configuration backups daily
- Cross-region backup replication
- Point-in-time recovery capability

### Recovery Procedures
- Database restore procedures
- Application state recovery
- Infrastructure recreation scripts
- RTO: 4 hours, RPO: 1 hour

## Scaling Guidelines

### Horizontal Scaling
- API Gateway: 2-10 replicas
- Workflow Engine: 1-5 replicas
- Node Executor: 2-20 replicas
- Webhook Handler: 1-5 replicas

### Vertical Scaling
- Memory limits based on workload
- CPU requests for guaranteed performance
- Auto-scaling based on metrics

## Troubleshooting

### Common Issues

#### Pod Startup Issues
```bash
# Check pod status
kubectl get pods -n flowforge-system

# Check pod logs
kubectl logs -n flowforge-system <pod-name>

# Describe pod for events
kubectl describe pod -n flowforge-system <pod-name>
```

#### Service Connectivity Issues
```bash
# Test service connectivity
kubectl run test-pod --image=curlimages/curl -it --rm -- sh

# From inside the pod
curl http://flowforge-api-service.flowforge-system.svc.cluster.local:3000/health
```

#### Database Connection Issues
```bash
# Check database pod
kubectl get pods -n flowforge-database

# Test database connection
kubectl exec -it -n flowforge-database postgres-0 -- psql -U flowforge -d flowforge_dev -c "SELECT 1;"
```

### Performance Optimization

#### Database Optimization
- Connection pooling configuration
- Query optimization
- Index management
- Partition strategies

#### Application Optimization
- Memory leak detection
- CPU profiling
- Cache optimization
- Load balancing tuning

## Maintenance

### Regular Maintenance Tasks
- Security updates (monthly)
- Performance reviews (weekly)
- Backup verification (daily)
- Log rotation (weekly)
- Certificate renewal (automated)

### Upgrade Procedures
1. Test in development environment
2. Deploy to staging for validation
3. Schedule maintenance window
4. Execute blue-green deployment
5. Verify functionality
6. Monitor for issues

## Support and Contributing

### Getting Help
- Check troubleshooting guide
- Review application logs
- Check monitoring dashboards
- Create support ticket with:
  - Environment details
  - Error messages
  - Steps to reproduce
  - Expected vs actual behavior

### Contributing
1. Fork the repository
2. Create feature branch
3. Test changes in development
4. Submit pull request
5. Update documentation

## License

This infrastructure code is part of the FlowForge project and follows the same licensing terms.
