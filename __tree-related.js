// mine, without refrence, some recursion included, o(n+n)
const listToTree = (list) => {
    let IDToStacks = {}

    const onIDAppended = (id = null) => {
        let holder = []
        IDToStacks[id] = IDToStacks[id] || []

        for(let i = 0; i < IDToStacks[id].length; i++) {
            holder.push(IDToStacks[id][i]())
        }
        return holder
    }

    for(let i = 0; i < list.length; i++) {
        let node = list[i]
        let title = node['title']
        let id = node['id']
        let parentID = node['parentID']

        IDToStacks[parentID] = IDToStacks[parentID] || []
        
        IDToStacks[parentID].push(() => {
            return {
                title,
                id,
                parentID,
                children: onIDAppended(id),
            }
        })
    }

    return onIDAppended()
}








// from internet, not a good way, mutable, using refrence chaining, o(2n)
const listToTree = (list) => {
    let tree = [],
        nodesIndexByID = {}

    for(let i = 0; i < list.length; i++) {
        let node = list[i]
        nodesIndexByID[node['id']] = i
        node['children'] = []
    }

    for(let i = 0; i < list.length; i++) {
        let node = list[i]
        let parentID = node['parentID']

        if(parentID !== null) {
            if(typeof nodesIndexByID[parentID] !== "undefined") {
                list[nodesIndexByID[parentID]]['children'].push(node)
            }
        }
        else {
            tree.push(node)
        }
    }

    return tree
}











// my first procedure, not good, using recursion, o(2n)
const listToTree = (list) => {
    let childsByParentIDs = {}

    for(let i = 0; i < list.length; i++) {
        let node = list[i]

        childsByParentIDs[node['parentID']] = childsByParentIDs[node['parentID']] || []
        childsByParentIDs[node['parentID']].push(node)

        counter ++
    }

    let tree = listToTreeRec(childsByParentIDs, null)

    setTimeout(() => {
        console.log("COUNTER :", counter)
    }, 1000)

    return tree
}
const listToTreeRec = (childsByParentIDs, parentID) => {
    let childs = childsByParentIDs[parentID] || []
    let tree = []

    for(let i = 0; i < childs.length; i++) {
        counter ++
        tree.push(childs[i])
        tree[tree.length - 1].children = listToTreeRec(childsByParentIDs, childs[i]['id'])
    }
    
    return tree
}







// list-to-tree npm package, using refrence chaining, o(n)
const listToTree = (list) => {
    var tree = [], childsByParentsIDs = {}

    for(let i = 0; i < list.length; i++) {

        let node = list[i]
        let id = node['id']
        let parentID = node['parentID']

        childsByParentsIDs[id] = childsByParentsIDs[id] || []
        node['children'] = childsByParentsIDs[id]

        if(parentID === null) {
            tree.push(node)
        }
        else {
            childsByParentsIDs[parentID] = childsByParentsIDs[parentID] || []
            childsByParentsIDs[parentID].push(node)
        }
        
    }
    
    return tree
}




// almost best performance, using reference chaining, o(n)
const listToTree = (list) => {
    let childrenOf = {}

    for(let i = 0; i < list.length; i++) {
        let node = list[i]
        let id = node[CURRENT_CONFIG.NODE_ID_KEY]
        let parentID = node[CURRENT_CONFIG.NODE_PARENT_ID_KEY]
        let title = node[CURRENT_CONFIG.NODE_TITLE_KEY]

        childrenOf[parentID] = childrenOf[parentID] || []

        
        // you must use || because of the id can be the same as
        // some other parentIDs
        childrenOf[id] = childrenOf[id] || []

        let newNode = generateNodeObject(id, title, parentID, childrenOf[id])
        childrenOf[parentID].push(newNode)
    }

    return childrenOf[null]
}








// mine, using stack array instead of recursion, not good
var counter = 0
const listToTree = (list, treeParentID = null) => {
    let treeBranch = []
    let otherNodes = []
    let stackedToDo = []
    
    for(let i = 0; i < list.length; i++) {
        counter ++
        console.log("LAUNCHED")

        let node = list[i]
        let id = node[CURRENT_CONFIG.NODE_ID_KEY]
        let title = node[CURRENT_CONFIG.NODE_TITLE_KEY]
        let parentID = node[CURRENT_CONFIG.NODE_PARENT_ID_KEY]

        if(parentID !== treeParentID) {
            otherNodes.push(node)
            continue
        }

        let newNode = generateNodeObject(id, title, parentID)
        treeBranch.push(newNode)

        stackedToDo.push(() => {
            // id & newNode must be scoped
            newNode[CURRENT_CONFIG.NODE_CHILDS_KEY] = listToTree(otherNodes, id)
        })
    }

    let i = 0, stack
    
    while(stack = stackedToDo[i]) {
        stack()
        i++
    }

    if(treeParentID === null) {
        setTimeout(() => {
            console.log('EEE', counter)
        }, 1000)
    }

    return treeBranch
}










// flatten with stack scheme
const flattenStacked = (list) => {
    let res = []
    let stack = []

    const expandFrame = (frame) => {
        if(Array.isArray(frame))
            return stack.concat(frame.reverse())
        else if(typeof frame === 'object')
            return stack.concat(Object.values(frame).reverse())
        else return stack
    }
    stack = expandFrame(list)

    while(stack.length) {
        let frame = stack.pop()

        if(typeof frame === 'object') {
            stack = expandFrame(frame)
        }
        else {
            res.push(frame)
        }
    }

    return res
}
// better performance over recursion
const flattenNonStack = (list) => {
    let res = []
    let queue = [].concat(list)

    const expand = (data) => {
        if(Array.isArray(data)) return data.concat(queue)
        else if(typeof data === "object") return Object.values(data).concat(queue)
    }

    while(queue.length) {
        let frame = queue.shift()

        if(typeof frame === "object") {
            queue = expand(frame)
        }
        else {
            res.push(frame)
        }
    }

    return res
}