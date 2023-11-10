/**
 * Implements `A highly-available move operation for replicated trees`
 * https://ieeexplore.ieee.org/document/9563274
 * https://martin.kleppmann.com/papers/move-op.pdf
 */
export type Tuple<N, M> = [N | null, M, N];
export interface Log<T, N, M> extends Array<LogMove<T, N, M>> {
}
export interface Tree<N, M> extends Map<string, Tuple<N, M>> {
}
export interface State<T, N, M> {
    log: Log<T, N, M>;
    tree: Tree<N, M>;
}
export interface Move<T, N, M> {
    time: T;
    parent: N | null;
    meta: M;
    child: N;
}
export interface LogMove<T, N, M> {
    time: T;
    oldParent: [N, M] | null;
    newParent: N | null;
    meta: M;
    child: N;
}
export declare const get_parent: <N, M>(tree: Tree<N, M>, child: N) => [N, M] | null;
export declare const path_to_root: <N, M>(tree: Tree<N, M>, child: N, path?: N[]) => N[];
export declare const ancestor: <N, M>(tree: Tree<N, M>, anc: N, child: N) => boolean;
export declare const do_op: <T, N, M>(tree: Tree<N, M>, { parent: newParent, time, child, meta }: Move<T, N, M>) => [Tree<N, M>, LogMove<T, N, M>];
export declare const undo_op: <T, N, M>(tree: Tree<N, M>, { oldParent, child }: LogMove<T, N, M>) => Tree<N, M>;
export declare const redo_op: <T, N, M>(state: State<T, N, M>, { time, newParent: parent, meta, child }: LogMove<T, N, M>) => State<T, N, M>;
export declare const apply_op: <T, N, M>(operation: Move<T, N, M>, state: State<T, N, M>) => State<T, N, M>;
export declare const apply_ops: <T, N, M>(operations: Move<T, N, M>[]) => State<T, N, M>;
export declare const unique_parent: <N extends number, M extends Uint8Array>(tree: Tree<N, M>) => boolean;
export declare const acyclic: <N, M>(tree: Tree<N, M>) => boolean;
//# sourceMappingURL=algorithm.d.ts.map