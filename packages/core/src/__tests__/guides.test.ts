import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Targets are ordered to match Phase 2–5 sequence
const TARGETS = ['webix-datagrid', 'webix-pivot', 'ag-grid-datagrid', 'ag-grid-pivot'] as const;

const DOCS_ROOT = resolve(import.meta.dirname, '../../../../docs/guides');

// Required frontmatter keys per SKILL.md
const REQUIRED_FRONTmatter_KEYS = [
  'name:',
  'description:',
  'verified_against:',
  'target:',
  'companion_guide:',
] as const;

// Required section headers per guide.md
const REQUIRED_GUIDE_SECTIONS = [
  '## Mapping',
  '## Important differences',
  '## Verification',
] as const;

describe('guides — structural smoke test', () => {
  for (const target of TARGETS) {
    const targetDir = resolve(DOCS_ROOT, target);

    describe(target, () => {
      it('SKILL.md exists and is non-empty', () => {
        const skillPath = resolve(targetDir, 'SKILL.md');
        const content = readFileSync(skillPath, 'utf8');
        expect(content.trim().length).toBeGreaterThan(0);
      });

      it('SKILL.md has all required frontmatter keys', () => {
        const skillPath = resolve(targetDir, 'SKILL.md');
        const content = readFileSync(skillPath, 'utf8');
        for (const key of REQUIRED_FRONTmatter_KEYS) {
          expect(content).toContain(key);
        }
      });

      it('guide.md exists and is non-empty', () => {
        const guidePath = resolve(targetDir, 'guide.md');
        const content = readFileSync(guidePath, 'utf8');
        expect(content.trim().length).toBeGreaterThan(0);
      });

      it('guide.md has all required section headers', () => {
        const guidePath = resolve(targetDir, 'guide.md');
        const content = readFileSync(guidePath, 'utf8');
        for (const section of REQUIRED_GUIDE_SECTIONS) {
          expect(content).toContain(section);
        }
      });

      it('guide.md states the current verified version', () => {
        const guidePath = resolve(targetDir, 'guide.md');
        const content = readFileSync(guidePath, 'utf8');
        expect(content).toContain('Last verified against the tablekit v2.1.0 source');
      });
    });
  }

  // The archive README remains at docs/archive/guides-agent-skills/README.md and indexes
  // all four targets via live-path links (updated in this phase). Verify it.
  it('docs/archive/guides-agent-skills/README.md exists and indexes all four targets', () => {
    const readmePath = resolve(
      import.meta.dirname,
      '../../../../docs/archive/guides-agent-skills/README.md',
    );
    const content = readFileSync(readmePath, 'utf8');
    expect(content.trim().length).toBeGreaterThan(0);
    for (const target of TARGETS) {
      expect(content).toContain(target);
    }
  });
});
