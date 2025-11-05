describe('flattenSteps with branch collections', () => {
    it('should flatten branch collection paths', () => {
        const branch = {
            branchId: '/branch',
            astPath: '/branch',
            kind: 'parallel',
            parallelId: '/branch',
            paths: [
                {
                    pathId: '/branch/path@0',
                    astPath: '/branch/paths@0',
                    steps: [
                        { source: 'A', target: 'B', astPath: '/1' },
                        { source: 'B', target: 'C', astPath: '/2' },
                    ],
                    isAnonymous: true,
                },
                {
                    pathId: '/branch/path@1',
                    astPath: '/branch/paths@1',
                    steps: [
                        { source: 'C', target: 'D', astPath: '/3' },
                    ],
                    isAnonymous: true,
                },
            ],
        };
        const result = flattenSteps(branch);
        expect(result).toHaveLength(3);
        expect(result[0]).toMatchObject({ source: 'A', target: 'B' });
        expect(result[1]).toMatchObject({ source: 'B', target: 'C' });
        expect(result[2]).toMatchObject({ source: 'C', target: 'D' });
    });
    it('should handle legacy parallel with __parallel array', () => {
        const legacyParallel = {
            branchId: '/branch',
            astPath: '/branch',
            kind: 'parallel',
            parallelId: '/branch',
            __parallel: [
                { source: 'A', target: 'B', astPath: '/1' },
                { source: 'B', target: 'C', astPath: '/2' },
            ],
            paths: [
                {
                    pathId: '/branch/path@0',
                    astPath: '/branch/paths@0',
                    steps: [
                        { source: 'A', target: 'B', astPath: '/1' },
                    ],
                    isAnonymous: true,
                },
            ],
        };
        const result = flattenSteps(legacyParallel);
        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({ source: 'A', target: 'B' });
        expect(result[1]).toMatchObject({ source: 'B', target: 'C' });
    });
    it('should return empty array for non-step items', () => {
        const nonStep = { someOtherProp: true };
        const result = flattenSteps(nonStep);
        expect(result).toEqual([]);
    });
    it('should handle nested branch collections', () => {
        const innerBranch = {
            branchId: '/inner',
            astPath: '/inner',
            kind: 'alternate',
            paths: [
                {
                    pathId: '/inner/path@0',
                    astPath: '/inner/paths@0',
                    steps: [
                        { source: 'C', target: 'D', astPath: '/3' },
                    ],
                    isAnonymous: true,
                },
            ],
        };
        const outerBranch = {
            branchId: '/outer',
            astPath: '/outer',
            kind: 'parallel',
            parallelId: '/outer',
            paths: [
                {
                    pathId: '/outer/path@0',
                    astPath: '/outer/paths@0',
                    steps: [
                        { source: 'A', target: 'B', astPath: '/1' },
                        innerBranch,
                    ],
                    isAnonymous: true,
                },
            ],
        };
        const result = flattenSteps(outerBranch);
        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({ source: 'A', target: 'B' });
        expect(result[1]).toMatchObject({ source: 'C', target: 'D' });
    });
});
