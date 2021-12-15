import { produce } from 'immer';
import { WritableDraft } from 'immer/dist/internal';

type CellState = {
  key: string;
  width: number;
};
type RowState = {
  cells: CellState[];
  height: number;
};
export type State = {
  keys: Record<string, true>;
  rows: RowState[];

  height: number;
  width: number;
};
export const defaultState: State = {
  keys: {},
  rows: [],
  height: 0,
  width: 0,
};

const MIN_ROW_HEIGHT = {
  md: 85,
};
const MIN_CELL_WIDTH = {
  md: 85,
};

const redistributeSizes =
  <T>({
    getElemSize,
    setElemSize,
  }: {
    getElemSize: (elem: WritableDraft<T>) => number;
    setElemSize: (elem: WritableDraft<T>, size: number) => void;
  }) =>
  (elems: WritableDraft<T>[]) => {
    // const redistributed = produce(inputElems, (elems) => {
    let spaceLeft = 1;
    let elemWithoutSizeCount = 0;

    elems.forEach((elem) => {
      const elemSize = getElemSize(elem);
      spaceLeft -= elemSize;
      if (!elemSize) {
        elemWithoutSizeCount += 1;
      }
    });

    const elemWithSizeCount = elems.length - elemWithoutSizeCount;

    if (spaceLeft) {
      if (elemWithoutSizeCount) {
        // distribute space left evenly to elem that has no space
        elems.forEach((elem) => {
          const elemSize = getElemSize(elem);
          if (!elemSize) {
            setElemSize(elem, spaceLeft / elemWithoutSizeCount);
          }
        });
        return;
      }
      // distribute space evenly to all elems
      elems.forEach((elem) => {
        const elemSize = getElemSize(elem);
        setElemSize(elem, elemSize + spaceLeft / elems.length);
      });
      return;
    }

    if (spaceLeft < 0) {
      // too much space taken
      const percentToKeep = 1 - spaceLeft;
      elems.forEach((elem) => {
        const elemSize = getElemSize(elem);
        if (elemSize) {
          setElemSize(elem, elemSize * percentToKeep);
        }
      });

      spaceLeft = 0;
    }

    if (elemWithoutSizeCount) {
      // all space taken but some elems have no size
      // take space from those who have and distribute it to those who have not :)
      const percentToKeep = elemWithSizeCount / elems.length;
      const sizeAttributed = (1 - percentToKeep) / elemWithoutSizeCount;
      elems.forEach((elem) => {
        const elemSize = getElemSize(elem);
        if (elemSize) {
          setElemSize(elem, elemSize * percentToKeep);
        } else {
          setElemSize(elem, sizeAttributed);
        }
      });
      return;
    }

    return;
  };

const redistributeRowSizes = redistributeSizes<RowState>({
  getElemSize: (row) => row.height,
  setElemSize: (row, size) => {
    row.height = size;
  },
});
const redistributeCellSizes = redistributeSizes<CellState>({
  getElemSize: (cell) => cell.width,
  setElemSize: (cell, size) => {
    cell.width = size;
  },
});

const redistributeRowCells = (rows: WritableDraft<RowState>[]) => {
  rows.forEach((row) => {
    redistributeCellSizes(row.cells);
  });
};

export const reducer = (
  state: State,
  action:
    | { type: 'sync-keys'; childKeys: Record<string, true> }
    | { type: 'resize-height'; height: number }
    | { type: 'resize-width'; width: number }
    | {
        type: 'resize-cell-width';
        rowIndex: number;
        cellIndex: number;
        delta: number;
      }
    | {
        type: 'resize-row-height';
        rowIndex: number;
        delta: number;
      }
    | {
        type: 'move-cell';
        srcRowIndex: number;
        srcCellIndex: number;
        dstRowIndex: number;
        dstCellIndex: number;
      }
    | {
        type: 'move-cell-to-new-row';
        srcRowIndex: number;
        srcCellIndex: number;
        dstRowIndex: number;
      }
): State => {
  switch (action.type) {
    case 'sync-keys': {
      return produce(state, (s) => {
        s.rows = s.rows.filter((row) => {
          row.cells = row.cells.filter((c) => action.childKeys[c.key]);
          return row.cells.length > 0;
        });

        const MAX_CELL_PER_ROW =
          Object.keys(action.childKeys).length > 2 ? 2 : 1;
        Object.keys(action.childKeys).forEach((key) => {
          if (s.keys[key]) {
            // child already in rows
            return;
          }
          s.keys[key] = true;
          const cell = {
            key,
            width: 0,
          };
          const lastRowIdx = s.rows.length - 1;
          if (
            lastRowIdx >= 0 &&
            s.rows[lastRowIdx].cells.length < MAX_CELL_PER_ROW
          ) {
            s.rows[lastRowIdx].cells.push(cell);
          } else {
            s.rows.push({
              cells: [cell],
              height: 0,
            });
          }
        });

        redistributeRowSizes(s.rows);
        redistributeRowCells(s.rows);
      });
    }
    case 'resize-height': {
      if (action.height === state.height) {
        return state;
      }
      return {
        ...state,
        height: action.height,
      };
    }
    case 'resize-width': {
      if (action.width === state.width) {
        return state;
      }
      return {
        ...state,
        width: action.width,
      };
    }

    case 'resize-cell-width': {
      const nextRows = [...state.rows];
      const row = state.rows[action.rowIndex];
      const percentDelta = action.delta / state.width;

      if (percentDelta < 0) {
        const cell = row.cells[action.cellIndex];
        if (cell.width * state.width <= MIN_CELL_WIDTH.md) {
          return state;
        }
      } else {
        const cell = row.cells[action.cellIndex + 1];
        if (cell.width * state.width <= MIN_CELL_WIDTH.md) {
          return state;
        }
      }

      nextRows[action.rowIndex] = {
        ...row,
        cells: row.cells.map((cell, idx) => {
          if (idx === action.cellIndex) {
            return {
              ...cell,
              width: cell.width + percentDelta,
            };
          }
          if (idx === action.cellIndex + 1) {
            return {
              ...cell,
              width: cell.width - percentDelta,
            };
          }
          return cell;
        }),
      };
      return {
        ...state,
        rows: nextRows,
      };
    }
    case 'resize-row-height': {
      let percentDelta = action.delta / state.height;
      if (percentDelta < 0) {
        const row = state.rows[action.rowIndex];
        if (row.height * state.height <= MIN_ROW_HEIGHT.md) {
          return state;
        }
      } else {
        const row = state.rows[action.rowIndex + 1];
        if (row.height * state.height <= MIN_ROW_HEIGHT.md) {
          return state;
        }
      }
      return {
        ...state,
        rows: state.rows.map((row, rIdx) => {
          if (action.rowIndex === rIdx) {
            return {
              ...row,
              height: row.height + percentDelta,
            };
          } else if (action.rowIndex + 1 === rIdx) {
            return {
              ...row,
              height: row.height - percentDelta,
            };
          }
          return row;
        }),
      };
    }
    case 'move-cell': {
      return produce(state, (s) => {
        if (action.dstRowIndex === action.srcRowIndex) {
          const row = s.rows[action.srcRowIndex];
          const cell = row.cells[action.srcCellIndex];
          if (action.srcCellIndex < action.dstCellIndex) {
            row.cells.splice(action.dstCellIndex, 0, cell);
            row.cells.splice(action.srcCellIndex, 1);
          } else {
            row.cells.splice(action.dstCellIndex, 0, cell);
            row.cells.splice(action.srcCellIndex + 1, 1);
          }
          return;
        } else {
          const srcRow = s.rows[action.srcRowIndex];
          const cell = srcRow.cells[action.srcCellIndex];

          // remove cell from src row
          srcRow.cells.splice(action.srcCellIndex, 1);

          //
          const dstRow = s.rows[action.dstRowIndex];
          dstRow.cells.splice(action.dstCellIndex, 0, {
            ...cell,
            // so its width is recomputed
            width: 0,
          });

          if (!srcRow.cells.length) {
            // remove src row if empty
            s.rows.splice(action.srcRowIndex, 1);
          }
          // resync cell widths
          redistributeRowCells(s.rows);
        }
        return;
      });
    }
    case 'move-cell-to-new-row': {
      return produce(state, (s) => {
        const srcRow = s.rows[action.srcRowIndex];
        const cell = srcRow.cells[action.srcCellIndex];
        srcRow.cells.splice(action.srcCellIndex, 1);

        s.rows.splice(action.dstRowIndex, 0, {
          cells: [cell],
          height: 0,
        });
        s.rows = s.rows.filter((row) => row.cells.length);

        redistributeRowSizes(s.rows);
        redistributeRowCells(s.rows);
      });
    }
    default:
  }
  console.log('reduce', state, action);
  return state;
};
