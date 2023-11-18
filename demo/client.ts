import net from 'net'
import repl from 'repl'
import * as algorithm from '../src/algorithm.js'

let global_ops: algorithm.LogMove<number, string, string>[] = []

const emptyState = (): { tree: algorithm.Tree<string, string>, log: algorithm.Log<number, string, string> } => ({
  tree: new Map([
    ['root', [null, 'root', 'root']],
    ['trash', [null, 'trash', 'trash']]
  ]),
  log: []
})

let cwd: string = 'root'
let state = emptyState()

const get_id = (tree: algorithm.Tree<string, string>, cwd: string, name: string): string | null => {
  for (const [id, dir] of tree) {
    if (dir[0] === cwd && dir[1] === name) {
      return id
    }
  }

  return null
}

const get_name = (tree: algorithm.Tree<string, string>, id: string): string => {
  const dir = tree.get(id)

  if (dir == null) {
    throw new Error('should not be undefined')
  }

  return dir[1]
}

const get_children = (tree: algorithm.Tree<string, string>, id: string): string[] => {
  const children: string[] = []

  for (const [_id, dir] of tree) {
    if (dir[0] === id) {
      children.push(_id)
    }
  }

  return children
}

const dir_contents = (tree: algorithm.Tree<string, string>, cwd: string): string[] => {
  const siblings: string[] = []
  for (const [dirname, dir] of tree) {
    if (dir[0] === cwd) {
      siblings.push(dirname)
    }
  }

  return siblings
}

const resolveParent = (tree: algorithm.Tree<string, string>, cwd: string): string | null => {
  const dir = tree.get(cwd)

  if (dir == null) {
    throw new Error('this should always be defined...')
  }

  return dir[0]
}

const to_name = (tree: algorithm.Tree<string, string>) => (child: string): string => {
  const dir = tree.get(child)

  if (dir == null) {
    throw new Error('why is this undefined?')
  }

  return dir[1]
}

const currentPrompt = (tree: algorithm.Tree<string, string>, cwd: string) => {
  const path = [...algorithm.path_to_root(tree, cwd).reverse().map(to_name(tree)), get_name(state.tree, cwd)]

  return '/' + path.join('/') + ' $ '
}

const updatePrompt = () => {
  replServer.setPrompt(currentPrompt(state.tree, cwd)) 
  replServer.displayPrompt()
}

const client = net.createConnection({ port: 8124 }, () => {
  client.on('end', () => process.exit(0)) 
  client.on('data', (data) => {
    const message: algorithm.LogMove<number, string, string>[] = JSON.parse(data.toString())

    global_ops = message

  })
})

const replServer = repl.start({
  prompt: currentPrompt(state.tree, cwd)
})

updatePrompt()

replServer.defineCommand('cd', {
  help: 'change directory',
  action (expression) {
    this.clearBufferedCommand()

    expression = expression.trim()

    if (expression === '..') {
      const parent = resolveParent(state.tree, cwd)
      if (parent === null) {
        console.log('already at root')
      } else {
        cwd = parent
      }
    } else {
      const id = get_id(state.tree, cwd, expression)

      if (id == null) {
        console.log('directory does not exist')
      } else {
        cwd = id
      }
    }

    updatePrompt()
  }
})

const latest_time = () => global_ops.reduce((prev, current) => Math.max(prev, current.time), 0) + 1

replServer.defineCommand('mkdir', {
  help: 'make directory',
  action (expression) {
    this.clearBufferedCommand()

    expression = expression.trim()

    const siblings = dir_contents(state.tree, cwd).map(to_name(state.tree))

    if (!siblings.includes(expression)) {
      const operation = {
        time: latest_time(),
        parent: cwd,
        meta: expression,
        child: Date.now().toString()
      }

      state = algorithm.apply_op(operation, state)
      client.write(JSON.stringify([state.log[state.log.length - 1]]))
    }

    updatePrompt()
  }
})

const exists = (tree: algorithm.Tree<string, string>, cwd: string, name: string): boolean => {
  const names: string[] = []
  for (const [, dir] of tree) {
    if (dir[0] === cwd) {
      names.push(dir[1])
    }
  }

  return names.includes(name)
}

replServer.defineCommand('rmdir', {
  help: 'remove directory',
  action (expression) {
    this.clearBufferedCommand()

    expression = expression.trim()

    if (exists(state.tree, cwd, expression)) {
      const operation: algorithm.Move<number, string, string> = {
        time: latest_time(),
        parent: 'trash',
        meta: expression,
        child: get_id(state.tree, cwd, expression) as string
      }

      state = algorithm.apply_op(operation, state)
      client.write(JSON.stringify([state.log[state.log.length - 1]]))
    }

    updatePrompt()
  }
})

// replServer.defineCommand('mvdir', {
//   help: 'move directory',
//   action (expression) {
//     this.clearBufferedCommand()

//     expression = expression.trim()

//     if (exists(state.tree, cwd, expression)) {
//       const operation: algorithm.Move<number, string, string> = {
//         time: latest_time(),
//         parent: cwd,
//         meta: expression,
//         child: get_id(state.tree, cwd, expression) as string
//       }

//       state = algorithm.apply_op(operation, state)
//     }

//     updatePrompt()
//   }
// })

replServer.defineCommand('ls', {
  help: 'list contents of current directory',
  action () {
    this.clearBufferedCommand()

    const children = get_children(state.tree, cwd)

    const siblings: string[] = []
    for (const [, dir] of state.tree) {
      if (dir[0] === cwd) {
        siblings.push(dir[1])
      }
    }

    console.log(children.map(to_name(state.tree)).join('\n'))
    updatePrompt()
  }
})

const timeSort = (a: algorithm.LogMove<number, string, string>, b: algorithm.LogMove<number, string, string>): number => {
  if (a.time > b.time) {
    return 1
  } else if (a.time < b.time) {
    return -1
  } else {
    return 0
  }
}

replServer.defineCommand('sync', {
  help: 'sync with latest changes',
  action () {
    this.clearBufferedCommand()

    for (const op of global_ops.sort(timeSort).map(({ time, newParent: parent, meta, child }) => ({ time, parent, meta, child }))) {
      state = algorithm.apply_op(op, state)
    }

    updatePrompt()
  }
})

replServer.defineCommand('log', {
  help: 'sync with latest changes',
  action () {
    this.clearBufferedCommand()

    console.log(state.tree)
    console.log(state.log)
    console.log(global_ops)

    updatePrompt()
  }
})