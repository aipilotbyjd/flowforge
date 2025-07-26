#!/bin/bash

# Kubernetes deployment script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-development}
NAMESPACE="flowforge-system"
DRY_RUN=false
SKIP_TESTS=false

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Check if kustomize is installed
    if ! command -v kustomize &> /dev/null; then
        print_error "kustomize is not installed or not in PATH"
        exit 1
    fi
    
    # Check if we can connect to the cluster
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to validate environment
validate_environment() {
    print_status "Validating environment: $ENVIRONMENT"
    
    case $ENVIRONMENT in
        development|staging|production)
            if [ ! -d "infrastructure/kubernetes/overlays/$ENVIRONMENT" ]; then
                print_error "Environment overlay directory not found: infrastructure/kubernetes/overlays/$ENVIRONMENT"
                exit 1
            fi
            ;;
        *)
            print_error "Invalid environment: $ENVIRONMENT. Must be one of: development, staging, production"
            exit 1
            ;;
    esac
    
    print_success "Environment validation passed"
}

# Function to apply base resources
apply_base_resources() {
    print_status "Applying base Kubernetes resources..."
    
    # Apply namespaces first
    kubectl apply -f infrastructure/kubernetes/base/namespaces/
    
    # Wait for namespaces to be ready
    kubectl wait --for=condition=Active namespace/$NAMESPACE --timeout=60s
    kubectl wait --for=condition=Active namespace/flowforge-database --timeout=60s
    kubectl wait --for=condition=Active namespace/flowforge-messaging --timeout=60s
    kubectl wait --for=condition=Active namespace/flowforge-monitoring --timeout=60s
    
    # Apply RBAC
    kubectl apply -f infrastructure/kubernetes/base/rbac/
    
    # Apply storage
    kubectl apply -f infrastructure/kubernetes/base/storage/
    
    # Apply networking
    kubectl apply -f infrastructure/kubernetes/base/networking/
    
    print_success "Base resources applied successfully"
}

# Function to apply environment-specific resources
apply_environment_resources() {
    print_status "Applying $ENVIRONMENT environment resources..."
    
    cd infrastructure/kubernetes/overlays/$ENVIRONMENT
    
    if [ "$DRY_RUN" = true ]; then
        print_warning "Dry run mode - showing what would be applied:"
        kustomize build . | kubectl apply --dry-run=client -f -
    else
        kustomize build . | kubectl apply -f -
    fi
    
    cd - > /dev/null
    
    print_success "Environment resources applied successfully"
}

# Function to wait for deployments
wait_for_deployments() {
    if [ "$DRY_RUN" = true ]; then
        print_warning "Skipping deployment wait in dry run mode"
        return
    fi
    
    print_status "Waiting for deployments to be ready..."
    
    # List of deployments to wait for
    deployments=(
        "flowforge-api-gateway"
        "flowforge-workflow-engine"
        "flowforge-node-executor"
        "flowforge-webhook-handler"
    )
    
    for deployment in "${deployments[@]}"; do
        print_status "Waiting for deployment: $deployment"
        if kubectl rollout status deployment/$deployment -n $NAMESPACE --timeout=300s; then
            print_success "Deployment $deployment is ready"
        else
            print_error "Deployment $deployment failed to become ready"
            kubectl get pods -n $NAMESPACE -l app.kubernetes.io/name=$deployment
            kubectl logs -n $NAMESPACE -l app.kubernetes.io/name=$deployment --tail=50
            exit 1
        fi
    done
    
    print_success "All deployments are ready"
}

# Function to run post-deployment tests
run_post_deployment_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        print_warning "Skipping post-deployment tests"
        return
    fi
    
    if [ "$DRY_RUN" = true ]; then
        print_warning "Skipping tests in dry run mode"
        return
    fi
    
    print_status "Running post-deployment tests..."
    
    # Check if all pods are running
    print_status "Checking pod status..."
    kubectl get pods -n $NAMESPACE
    
    # Check services
    print_status "Checking services..."
    kubectl get services -n $NAMESPACE
    
    # Test API health endpoints
    print_status "Testing API health endpoints..."
    
    # Port forward to test locally (in case ingress is not available)
    kubectl port-forward -n $NAMESPACE service/flowforge-api-service 8080:3000 &
    PF_PID=$!
    
    sleep 5
    
    if curl -f http://localhost:8080/health &> /dev/null; then
        print_success "API Gateway health check passed"
    else
        print_error "API Gateway health check failed"
        kill $PF_PID || true
        exit 1
    fi
    
    kill $PF_PID || true
    
    print_success "Post-deployment tests passed"
}

# Function to show deployment status
show_deployment_status() {
    print_status "Deployment Status Summary:"
    echo "=========================="
    echo "Environment: $ENVIRONMENT"
    echo "Namespace: $NAMESPACE"
    echo "Timestamp: $(date)"
    echo ""
    
    print_status "Pods:"
    kubectl get pods -n $NAMESPACE -o wide
    echo ""
    
    print_status "Services:"
    kubectl get services -n $NAMESPACE
    echo ""
    
    print_status "Ingress:"
    kubectl get ingress -n $NAMESPACE
    echo ""
    
    if [ "$ENVIRONMENT" != "development" ]; then
        print_status "Certificates:"
        kubectl get certificates -n $NAMESPACE
    fi
}

# Function to rollback deployment
rollback_deployment() {
    print_error "Deployment failed. Rolling back..."
    
    deployments=(
        "flowforge-api-gateway"
        "flowforge-workflow-engine"
        "flowforge-node-executor"
        "flowforge-webhook-handler"
    )
    
    for deployment in "${deployments[@]}"; do
        if kubectl rollout history deployment/$deployment -n $NAMESPACE &> /dev/null; then
            print_status "Rolling back deployment: $deployment"
            kubectl rollout undo deployment/$deployment -n $NAMESPACE
        fi
    done
    
    print_error "Rollback completed"
    exit 1
}

# Function to cleanup on exit
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        print_error "Script failed with exit code $exit_code"
        if [ "$DRY_RUN" = false ]; then
            rollback_deployment
        fi
    fi
}

# Trap cleanup function
trap cleanup EXIT

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --help)
            echo "Usage: $0 [ENVIRONMENT] [OPTIONS]"
            echo ""
            echo "ENVIRONMENT: development, staging, or production (default: development)"
            echo ""
            echo "OPTIONS:"
            echo "  --dry-run     Show what would be deployed without applying changes"
            echo "  --skip-tests  Skip post-deployment tests"
            echo "  --help        Show this help message"
            exit 0
            ;;
        *)
            ENVIRONMENT=$1
            shift
            ;;
    esac
done

# Main execution
main() {
    print_status "🚀 Starting FlowForge Kubernetes deployment..."
    print_status "Environment: $ENVIRONMENT"
    
    if [ "$DRY_RUN" = true ]; then
        print_warning "Running in DRY RUN mode"
    fi
    
    check_prerequisites
    validate_environment
    apply_base_resources
    apply_environment_resources
    wait_for_deployments
    run_post_deployment_tests
    show_deployment_status
    
    print_success "✅ FlowForge deployment to $ENVIRONMENT completed successfully!"
    
    if [ "$ENVIRONMENT" = "development" ]; then
        print_status "Access the application:"
        print_status "- API: http://localhost:3000 (port-forward) or https://api.flowforge.local"
        print_status "- Grafana: http://localhost:3001 (port-forward)"
        print_status "- Prometheus: http://localhost:9090 (port-forward)"
    fi
}

# Run main function
main
