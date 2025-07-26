import { Tree, joinPathFragments } from '@nx/devkit';
import * as fs from 'fs';

export function createFile(tree: Tree, path: string, content: string): void {
  tree.write(path, content);
}

export function readFile(tree: Tree, path: string): string {
  return tree.read(path).toString();
}

export function fileExists(tree: Tree, path: string): boolean {
  return tree.exists(path);
}

export function copyFile(
  tree: Tree,
  source: string,
  destination: string
): void {
  const content = tree.read(source);
  if (content) {
    tree.write(destination, content);
  }
}

export function readSystemFile(path: string): string {
  return fs.readFileSync(path, 'utf8');
}

export function writeSystemFile(path: string, content: string): void {
  fs.writeFileSync(path, content, 'utf8');
}
