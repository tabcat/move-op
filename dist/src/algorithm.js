"use strict";
/**
 * Implements `A highly-available move operation for replicated trees`
 * https://ieeexplore.ieee.org/document/9563274
 * https://martin.kleppmann.com/papers/move-op.pdf
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.acyclic = exports.unique_parent = exports.apply_ops = exports.apply_op = exports.redo_op = exports.undo_op = exports.do_op = exports.ancestor = exports.path_to_root = exports.get_parent = void 0;
const get_parent = (tree, child) => {
    const tuple = tree.get(String(child));
    if (tuple == null || tuple[0] == null) {
        return null;
    }
    return [tuple[0], tuple[1]];
};
exports.get_parent = get_parent;
const path_to_root = (tree, child, path = []) => {
    var _a;
    const [parent] = (_a = (0, exports.get_parent)(tree, child)) !== null && _a !== void 0 ? _a : [null];
    if (parent === null) {
        return path;
    }
    else {
        path.push(parent);
        return (0, exports.path_to_root)(tree, parent, path);
    }
};
exports.path_to_root = path_to_root;
const ancestor = (tree, anc, child) => (0, exports.path_to_root)(tree, child).includes(anc);
exports.ancestor = ancestor;
const do_op = (tree, { parent: newParent, time, child, meta }) => {
    tree = new Map(tree.entries());
    const oldParent = (0, exports.get_parent)(tree, child);
    const log_move = {
        time,
        oldParent,
        newParent,
        child,
        meta
    };
    if (!(0, exports.ancestor)(tree, child, newParent) && child !== newParent && (newParent === null || tree.has(String(newParent)))) {
        tree.set(String(child), [newParent, meta, child]);
    }
    return [tree, log_move];
};
exports.do_op = do_op;
const undo_op = (tree, { oldParent, child }) => {
    tree = new Map(tree.entries());
    if (oldParent !== null) {
        tree.set(String(child), [oldParent[0], oldParent[1], child]);
    }
    else {
        tree.delete(String(child));
    }
    return tree;
};
exports.undo_op = undo_op;
const redo_op = (state, { time, newParent: parent, meta, child }) => {
    const [tree, operation] = (0, exports.do_op)(state.tree, { time, parent, meta, child });
    return { tree, log: [...state.log, operation] };
};
exports.redo_op = redo_op;
const apply_op = (operation, state) => {
    if (state.log.length === 0) {
        const [tree, log_op] = (0, exports.do_op)(state.tree, operation);
        return { tree, log: [log_op] };
    }
    const latest_op = state.log[state.log.length - 1];
    // todo: handle non number times
    if (operation.time < latest_op.time) {
        const sans_latest_op = state.log.slice(0, state.log.length - 1);
        return (0, exports.redo_op)((0, exports.apply_op)(operation, { log: sans_latest_op, tree: (0, exports.undo_op)(state.tree, latest_op) }), latest_op);
    }
    else {
        const [tree, log_op] = (0, exports.do_op)(state.tree, operation);
        return { log: [...state.log, log_op], tree };
    }
};
exports.apply_op = apply_op;
const apply_ops = (operations) => {
    let state = { log: [], tree: new Map() };
    for (const operation of operations) {
        state = (0, exports.apply_op)(operation, state);
    }
    return state;
};
exports.apply_ops = apply_ops;
const unique_parent = (tree) => {
    for (const [k, v] of tree.entries()) {
        if (k !== v[2].toString()) {
            return false;
        }
    }
    return true;
};
exports.unique_parent = unique_parent;
const acyclic = (tree) => {
    for (const [, , child] of tree.values()) {
        if ((0, exports.ancestor)(tree, child, child)) {
            return false;
        }
    }
    return true;
};
exports.acyclic = acyclic;
//# sourceMappingURL=algorithm.js.map