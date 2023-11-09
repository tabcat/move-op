import * as algorithm from '../src/algorithm.js'
import { assert } from 'chai'

type Time = string
type NodeId = string
type Meta = string

const tree = new Map()
tree.set('c', [null, '', 'c'])
tree.set('b', ['c', '', 'b'])
tree.set('d', ['c', '', 'd'])
tree.set('a', ['b', '', 'a'])

const log = [
  {
    time: '0',
    newParent: null,
    oldParent: null,
    meta: '',
    child: 'c'
  },
  {
    time: '1',
    newParent: 'c',
    oldParent: null,
    meta: '',
    child: 'b'
  },
  {
    time: '2',
    newParent: 'c',
    oldParent: null,
    meta: '',
    child: 'd'
  },
  {
    time: '3',
    newParent: 'b',
    oldParent: null,
    meta: '',
    child: 'a'
  } 
]

const state = { tree, log }

const toOperation = <T, N, M>({
  time,
  newParent: parent,
  meta,
  child
}: algorithm.LogMove<T, N, M>): algorithm.Move<T, N, M> => ({
  time,
  parent,
  meta,
  child
})

describe('algorithm', () => {
  describe('get_parent', () => {
    const get_parent = algorithm.get_parent

    it('returns the parent for a child', () => {
      const parent = get_parent(tree, 'a')

      if (parent == null) {
        throw new Error('a does not have a parent')
      }

      assert.strictEqual(parent[0], 'b', 'parent node id')
      assert.strictEqual(parent[1], '', 'child meta value')
    })
  })

  describe('path_to_root', () => {
    const path_to_root = algorithm.path_to_root

    it('returns the path to root for a leaf', () => {
      const path = path_to_root(tree, 'a')

      assert.strictEqual(path.length, 2)
      assert.strictEqual(path[0], 'b')
      assert.strictEqual(path[1], 'c')
    })

    it('returns the path to root for a branch', () => {
      const path = path_to_root(tree, 'b')

      assert.strictEqual(path.length, 1)
      assert.strictEqual(path[0], 'c')
    })

    it('returns the path to root for a root', () => {
      const path = path_to_root(tree, 'c')

      assert.strictEqual(path.length, 0)
    })
  })

  describe('ancestor', () => {
    const ancestor = algorithm.ancestor

    it('returns true if node1 is ancestor to node2', () => {
      assert.strictEqual(ancestor(tree, 'b', 'a'), true)
      assert.strictEqual(ancestor(tree, 'c', 'a'), true)
    })

    it('returns false if node1 is not ancestor to node2', () => {
      assert.strictEqual(ancestor(tree, 'a', 'a'), false)
      assert.strictEqual(ancestor(tree, 'a', 'b'), false)
      assert.strictEqual(ancestor(tree, 'a', 'c'), false)
      assert.strictEqual(ancestor(tree, 'a', 'd'), false)
    })
  })

  describe('do_op', () => {
    const do_op = algorithm.do_op

    it('moves child to another parent and returns a new tree and log op', () => {
      const move: algorithm.Move<Time, NodeId, Meta> = { 
        time: '',
        parent: 'd',
        meta: '',
        child: 'a'
      }
      const [treePrime, log_op] = do_op(tree, move)

      if (log_op.oldParent == null) {
        throw new Error('a does not have a parent')
      }

      const a = treePrime.get('a')

      if (a == null) {
        throw new Error('a does not exist in tree')
      }

      assert.strictEqual(a[0], 'd')
      assert.strictEqual(a[1], '')
      assert.strictEqual(a[2], 'a')

      assert.strictEqual(log_op.oldParent[0], 'b')
      assert.strictEqual(log_op.oldParent[1], '')
    })

    it('changes the meta for a child; returns a new tree and new log op', () => {
      const move: algorithm.Move<Time, NodeId, Meta> = { 
        time: '',
        parent: 'b',
        meta: 'new meta',
        child: 'a'
      }
      const [treePrime, log_op] = do_op(tree, move)

      if (log_op.oldParent == null) {
        throw new Error('a does not have a parent')
      }

      const a = treePrime.get('a')

      if (a == null) {
        throw new Error('a does not exist in tree')
      }

      assert.strictEqual(a[0], 'b')
      assert.strictEqual(a[1], 'new meta')
      assert.strictEqual(a[2], 'a')

      assert.strictEqual(log_op.oldParent[0], 'b')
      assert.strictEqual(log_op.oldParent[1], '')
    })

    it('does not move child to another parent; returns the same tree and new log op', () => {
      const move: algorithm.Move<Time, NodeId, Meta> = { 
        time: '',
        parent: 'a',
        meta: '',
        child: 'b'
      }
      const [treePrime, log_op] = do_op(tree, move)

      if (log_op.oldParent == null) {
        throw new Error('a does not have a parent')
      }

      const b = treePrime.get('b')

      if (b == null) {
        throw new Error('a does not exist in tree')
      }

      assert.strictEqual(b[0], 'c')
      assert.strictEqual(b[1], '')
      assert.strictEqual(b[2], 'b')

      assert.strictEqual(log_op.oldParent[0], 'c')
      assert.strictEqual(log_op.oldParent[1], '')
    })

    it('does not move child to itself; returns the same tree and new log op', () => {
      const move: algorithm.Move<Time, NodeId, Meta> = { 
        time: '',
        parent: 'a',
        meta: '',
        child: 'a'
      }
      const [treePrime, log_op] = do_op(tree, move)

      if (log_op.oldParent == null) {
        throw new Error('a does not have a parent')
      }

      const a = treePrime.get('a')

      if (a == null) {
        throw new Error('a does not exist in tree')
      }


      assert.strictEqual(a[0], 'b')
      assert.strictEqual(a[1], '')
      assert.strictEqual(a[2], 'a')

      assert.strictEqual(log_op.oldParent[0], 'b')
      assert.strictEqual(log_op.oldParent[1], '')
    })
  })

  describe('undo_op', () => {
    const undo_op = algorithm.undo_op

    it('undoes an operation', () => {
      const log_op = {
        time: '',
        newParent: 'b',
        oldParent: ['d', ''] as [string, string],
        child: 'a',
        meta: ''
      }

      const treePrime = undo_op(tree, log_op)

      const a = treePrime.get('a')

      if (a == null) {
        throw new Error('a does not exist in tree')
      }

      assert.strictEqual(a[0], 'd')
      assert.strictEqual(a[1], '')
      assert.strictEqual(a[2], 'a')
    })

    it('undoes a creative operation', () => {
      const log_op = {
        time: '',
        newParent: 'b',
        oldParent: null,
        child: 'a',
        meta: ''
      }

      const treePrime = undo_op(tree, log_op)

      const a = treePrime.get('a')

      assert.strictEqual(a, undefined)
    })
  })

  describe('redo_op', () => {
    const redo_op = algorithm.redo_op

    it('redoes an operation', () => {
      const log_op: algorithm.LogMove<Time, NodeId, Meta> = { 
        time: '',
        newParent: 'd',
        oldParent: ['b', ''],
        meta: '',
        child: 'a'
      }

      const statePrime = redo_op(state, log_op)

      const a = statePrime.tree.get('a')

      if (a == null) {
        throw new Error('a does not exist in tree')
      }

      assert.strictEqual(statePrime.log.length, log.length + 1)
      assert.deepStrictEqual(statePrime.log[statePrime.log.length - 1], log_op)
      
      assert.strictEqual(a[0], 'd')
      assert.strictEqual(a[1], '')
      assert.strictEqual(a[2], 'a')
    })
  })

  describe('apply_op', () => {
    const apply_op = algorithm.apply_op

    it('applies a single operation to an empty state', () => {
      const log_op: algorithm.LogMove<Time, NodeId, Meta>  = {
        time: '4',
        newParent: null,
        oldParent: null,
        meta: '',
        child: 'a'
      }

      const statePrime = apply_op(toOperation(log_op), { tree: new Map(), log: [] })

      const a = statePrime.tree.get('a')

      if (a == null) {
        throw new Error('a does not exist in tree')
      }

      assert.strictEqual(a[0], null)
      assert.strictEqual(a[1], '')
      assert.strictEqual(a[2], 'a')

      const latest_op = statePrime.log[statePrime.log.length - 1]

      assert.strictEqual(latest_op.oldParent, null)
    })

    it('applies a current operation to a state', () => {
      const log_op: algorithm.LogMove<Time, NodeId, Meta>  = {
        time: '4',
        newParent: 'c',
        oldParent: ['b', ''],
        meta: '',
        child: 'a'
      }

      const statePrime = apply_op(toOperation(log_op), state)

      const a = statePrime.tree.get('a')

      if (a == null) {
        throw new Error('a does not exist in tree')
      }

      assert.strictEqual(a[0], 'c')
      assert.strictEqual(a[1], '')
      assert.strictEqual(a[2], 'a')

      const latest_op = statePrime.log[statePrime.log.length - 1]

      assert.deepStrictEqual(latest_op, log_op)
      assert.deepStrictEqual(latest_op, log_op)
    })

    it('applies a previous operation to a state', () => {
      const log_op = log.slice(0, 1)[0]

      const statePrime = apply_op(toOperation(log_op), { tree: new Map(), log: log.slice(1) })

      const a = statePrime.tree.get('a')

      if (a == null) {
        throw new Error('a does not exist in tree')
      }

      assert.strictEqual(a[0], 'b')
      assert.strictEqual(a[1], '')
      assert.strictEqual(a[2], 'a')

      const oldest_op = statePrime.log[0]

      assert.deepStrictEqual(oldest_op, log_op)
    })
  })

  describe('apply_ops', () => {
    const apply_ops = algorithm.apply_ops
    it('applies multiple operations to an empty state', () => {
      const statePrime = apply_ops(log.map(toOperation))

      assert.deepStrictEqual(statePrime, state)
    })
  })

  describe('unique_parent', () => {
    const unique_parent = algorithm.unique_parent
    it('returns true if there are only unique parents', () => {
      assert.strictEqual(unique_parent(tree), true)
    })
  })

  describe('acyclic', () => {
    const acyclic = algorithm.acyclic
    it('returns true if there are no cycles', () => {
      assert.strictEqual(acyclic(tree), true)
    })
  })
})