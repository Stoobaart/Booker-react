import deductions, { deductionsById } from './deductions';
import { boards } from './boards';
import { investigationNotes } from '../../investigation/data/investigationNotes';
import { inventoryItems } from '../../inventory/data/items';

const exists = (nodeId) => {
  const [kind, refId] = nodeId.split(':');
  return { note: investigationNotes, item: inventoryItems, deduction: deductionsById }[kind]?.[refId] !== undefined;
};

describe('deductions', () => {
  it.each(deductions)('$id is on a board, made by a string between two things that exist', (deduction) => {
    expect(boards.map((b) => b.id)).toContain(deduction.boardId);
    expect(exists(deduction.from)).toBe(true);
    expect(exists(deduction.to)).toBe(true);
    expect(deduction.from).not.toBe(deduction.to);
  });

  it('makes at most one deduction from each pair', () => {
    const pairs = deductions.map((d) => [d.from, d.to].sort().join('|'));
    expect(new Set(pairs).size).toBe(pairs.length);
  });

  it.each(deductions.flatMap((d) => [d.from, d.to]).filter((id) => id.startsWith('note:')))(
    '%s can be pinned',
    (nodeId) => {
      expect(investigationNotes[nodeId.slice('note:'.length)].pinnable).not.toBe(false);
    }
  );

  it("doesn't name Derek in what Frank can learn before reading his name tag", () => {
    expect(JSON.stringify(investigationNotes['derek-fears-blame'])).not.toMatch(/Derek/);
  });

  it('builds on post-its from its own board', () => {
    deductions.flatMap((d) => [d.from, d.to].filter((id) => id.startsWith('deduction:')).map((id) => [d, id.slice('deduction:'.length)]))
      .forEach(([deduction, refId]) => {
        expect(refId).not.toBe(deduction.id);
        expect(deductionsById[refId].boardId).toBe(deduction.boardId);
      });
  });

  it('has unique ids', () => {
    expect(Object.keys(deductionsById)).toHaveLength(deductions.length);
  });
});
