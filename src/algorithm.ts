/**
 * Implements `A highly-available move operation for replicated trees`
 * https://ieeexplore.ieee.org/document/9563274
 * https://martin.kleppmann.com/papers/move-op.pdf
 */

export type Tuple<N, M> = [N | null, M, N]

export interface Log<T, N, M> extends Array<LogMove<T, N, M>>{}

export interface Tree<N, M> extends Map<string, Tuple<N, M>> {}

export interface State<T, N, M> {
  log: Log<T, N, M>
  tree: Tree<N, M>
}

export interface Move<T, N, M> {
  time: T
  parent: N
  meta: M
  child: N
}

export interface LogMove<T, N, M> {
  time: T
  oldParent: [N, M] | null
  newParent: N
  meta: M
  child: N
}

export const get_parent = <N, M>(tree: Tree<N, M>, child: N): [N, M] | null => {
  const tuple = tree.get(String(child))

  if (tuple == null || tuple[0] == null) {
    return null
  }

  return [tuple[0], tuple[1]]
}

export const path_to_root = <N, M>(tree: Tree<N, M>, child: N, path: N[] = []): N[] => {
  const [parent] = get_parent(tree, child) ?? [null]

  if (parent === null) {
    return path
  } else {
    path.push(parent)
    return path_to_root(tree, parent, path)
  }
}

export const ancestor = <N, M>(tree: Tree<N, M>, anc: N, child: N): boolean => path_to_root<N, M>(tree, child).includes(anc)

export const do_op = <T, N, M>(tree: Tree<N, M>, { parent: newParent, time, child, meta }: Move<T, N, M>): [Tree<N, M>, LogMove<T, N, M>] => {
  tree = new Map(tree.entries())

  const oldParent = get_parent(tree, child)
  const log_move: LogMove<T, N, M> = {
    time,
    oldParent,
    newParent,
    child,
    meta
  }

  if (!ancestor(tree, child, newParent) || child !== newParent) {
    tree.set(String(child), [newParent, meta, child])
  }

  return [tree, log_move] 
}

export const undo_op = <T, N, M>(tree: Tree<N, M>, { oldParent, child }: LogMove<T, N, M>): Tree<N, M> => {
  tree = new Map(tree.entries())

  if (oldParent !== null) {
    tree.set(String(child), [oldParent[0], oldParent[1], child])
  } else {
    tree.delete(String(child))
  }

  return tree
}

export const redo_op = <T, N, M>(state: State<T, N, M>, { time, newParent: parent, meta, child }: LogMove<T, N, M>): State<T, N, M> => {
  const [tree, operation] = do_op(state.tree, { time, parent, meta, child })

  return { tree, log: [...state.log, operation] }
}

export const apply_op = <T, N, M>(operation: Move<T, N, M>, state: State<T, N, M>): State<T, N, M> => {
  if (state.log.length === 0) {
    const [tree, log_op] = do_op(state.tree, operation)
    return { tree, log: [log_op] }
  }
 
  const latest_op = state.log[state.log.length - 1]

  // todo: handle non number times
  if (operation.time < latest_op.time) {
    const sans_latest_op = state.log.slice(0, state.log.length - 1)
    return redo_op(apply_op(operation, { log: sans_latest_op, tree: undo_op(state.tree, latest_op) }), latest_op)
  } else {
    const [tree, log_op] = do_op(state.tree, operation)

    return { log: [...state.log, log_op], tree }
  }
}

export const apply_ops = <T, N, M>(operations: Array<Move<T, N, M>>): State<T, N, M> => {
  const state: State<T, N, M> = { log: [], tree: new Map() }

  for (const operation of operations) {
    apply_op(operation, state)
  }

  return state
}

export const unique_parent = <N extends number, M extends Uint8Array>(tree: Tree<N, M>) => {
  for (const [k, v] of tree.entries()) {
    if (k !== v[2].toString()) {
      return false
    }
  }

  return true
}

export const acyclic = <N, M>(tree: Tree<N, M>, child: N): boolean => ancestor<N, M>(tree, child, child)
