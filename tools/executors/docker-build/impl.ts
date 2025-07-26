import { exec } from 'child_process';
import { promisify } from 'util';
import { ExecutorContext } from '@nx/devkit';

const execAsync = promisify(exec);

interface DockerBuildOptions {
  dockerfile: string;
  context?: string;
  imageName: string;
  imageTag?: string;
  buildArgs?: Record<string, string>;
  push?: boolean;
}

export default async function dockerBuildExecutor(
  options: DockerBuildOptions,
  context: ExecutorContext
) {
  try {
    const { dockerfile, context: buildContext, imageName, imageTag = 'latest', buildArgs = {}, push = false } = options;
    
    // Build Docker image
    const buildArgsString = Object.entries(buildArgs)
      .map(([key, value]) => `--build-arg ${key}=${value}`)
      .join(' ');
    
    const contextPath = buildContext || '.';
    const fullImageName = `${imageName}:${imageTag}`;
    
    const buildCommand = `docker build -f ${dockerfile} ${buildArgsString} -t ${fullImageName} ${contextPath}`;
    console.log(`Running: ${buildCommand}`);
    
    const { stdout, stderr } = await execAsync(buildCommand);
    console.log(stdout);
    if (stderr) console.error(stderr);
    
    // Push to registry if requested
    if (push) {
      const pushCommand = `docker push ${fullImageName}`;
      console.log(`Running: ${pushCommand}`);
      
      const { stdout: pushStdout, stderr: pushStderr } = await execAsync(pushCommand);
      console.log(pushStdout);
      if (pushStderr) console.error(pushStderr);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Docker build failed:', error);
    return { success: false, error: error.message };
  }
}
