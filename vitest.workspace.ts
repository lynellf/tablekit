import { defineWorkspace } from 'vitest/config';

/**
 * Vitest workspace projects. Each entry runs in isolation
 * (its own test runner, its own deps) — the right shape for a monorepo.
 */
export default defineWorkspace(['packages/react', 'packages/pivot']);
