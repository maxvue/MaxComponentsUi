import assert from 'node:assert/strict';
import test from 'node:test';
import { gates, runGates } from './verify.mjs';

test('o gate canônico executa todas as etapas mesmo após uma falha', () => {
    const calls = [];
    assert.throws(() => runGates({
        execute: (args) => {
            calls.push(args.join(' '));
            return calls.length === 2 ? 1 : 0;
        }
    }), /Gate canônico reprovado/);

    assert.equal(calls.length, gates.length);
    assert.equal(calls.at(-1), gates.at(-1)[1].join(' '));
});
