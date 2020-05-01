window.treeImmutable = (() => {
'use strict'



// config
const DEFAULT_CONFIGS = {
    NODE_ID_KEY: "id",
    NODE_TITLE_KEY: "title",
    NODE_PARENT_ID_KEY: "parentID",
    NODE_ORDER_KEY: "order",
    NODE_CHILDREN_KEY: "children",
}
const extendConfig = (config, newConfig = {}) => {
    Object.assign(config, {
        ...DEFAULT_CONFIGS,
        ...newConfig,
    })
}


// extract defined values
const extractDefinedValues = (obj) => {
    var newOBJ = {}
    for(var key in obj) {
        if(!obj.hasOwnProperty(key)) continue
        
        if(obj[key] !== undefined) {
            newOBJ[key] = obj[key]
        }
    }
    return newOBJ
}


// filter object
const filterObject = (obj, checker) => {
    let keys = Object.keys(obj)

    return keys.reduce((holder, key) => {
        if(checker(key, obj[key])) {
            holder[key] = obj[key]
        }
        return holder
    }, {})
}


// insert by order (mutable)
const isNumber = num => typeof num === "number" && num === num// for NaN

const insertByOrderMutator = (array, item, orderKey) => {
    let itemOrder = item[orderKey]
    let itemPushed = false

    if(isNumber(itemOrder)) {
        for(let i = 0; i < array.length; i++) {
            let loopItem = array[i]

            // we have controlled the values or `order`
            // so this cannot be undefined
            let loopItemOrder = loopItem[orderKey]

            // if(!isNumber(loopItemOrder) || itemOrder < loopItemOrder) {
            if(itemOrder < loopItemOrder) {
                array.splice(i, 0, item)
                itemPushed = true
                break
            }
        }

        // we need it in case of order is larger
        // than other children orders, means the
        // for loop has reached the end but item
        // is not added
        if(!itemPushed) array.push(item)
    }
    else {
        // we have controlled the values or `order`
        // so this cannot be undefined
        let lastItem = array[array.length - 1]
        let lastItemOrder = lastItem ? lastItem[orderKey] : 0

        item[orderKey] = lastItemOrder + 1
        itemOrder = item[orderKey]

        array.push(item)
        itemPushed = true
    }

}

    
// flat list to object
const flatListToFlatObject = (list, destructor) => {
    let flatObject = {}

    for(let i = 0; i < list.length; i++) {
        let node = list[i]
        let { id, title, parentID, order } = destructor(node)
        parentID = typeof parentID === "number" ? parentID : null

        flatObject[id] = { id, title, parentID, order }
    }

    return flatObject
}

// list to tree
const flatObjectToTree = (flatObject, returnRoot = true) => {
    let childrenOf = {},
        key

    for(key in flatObject) {
        if(!flatObject.hasOwnProperty(key)) continue

        let node = flatObject[key]
        let id = node['id']
        let parentID = node['parentID']
        parentID = typeof parentID === "number" ? parentID : null

        childrenOf[parentID] = childrenOf[parentID] || []
        childrenOf[id] = childrenOf[id] || []

        let newNode = {
            ...node,
            children: childrenOf[id]
        }

        insertByOrderMutator(childrenOf[parentID], newNode, 'order')
    }

    return returnRoot ? childrenOf[null] : childrenOf
}
const traverseNodeChildren = (nodeChildren, callback, level = 0) => {
    if(!Array.isArray(nodeChildren)) return

    for(let i = 0; i < nodeChildren.length; i++) {
        let child = nodeChildren[i]
        let childNestedChildren = child['children']
        callback(child, level)
        traverseNodeChildren(childNestedChildren, callback, level + 1)
    }
}
const getAllNestedChildrenIDs = (nodeChildren) => {
    let childrenIDs = []
    traverseNodeChildren(nodeChildren, node => childrenIDs.push(node['id']))
    return childrenIDs
}







// tree instance builder
function createTree(initialConfig = {}) {

    // init config
    const CONFIG = {}
    extendConfig(CONFIG, initialConfig)


    
    // destruct node
    const destructInputNode = (node) => ({
        id: node[CONFIG.NODE_ID_KEY],
        title: node[CONFIG.NODE_TITLE_KEY],
        parentID: node[CONFIG.NODE_PARENT_ID_KEY],
        order: node[CONFIG.NODE_ORDER_KEY],
        children: node[CONFIG.NODE_CHILDREN_KEY]
    })


    // initialize store
    const flatObjectStore = window.storeImmutable.createStore({})
    const childrenOfStore = window.storeImmutable.createStore({})
    const treeStore = window.storeImmutable.createStore([])

    flatObjectStore.subscribe((state) => {
        let childrenOf = flatObjectToTree(state, false)
        childrenOfStore.setState(() => childrenOf)
        treeStore.setState(() => childrenOf[null])
    })


    // helpers
    const nodeUpdater = (state, nodesToUpdate, addNonExistNodes) => {
        let newState = { ...state }
        let childrenOf = childrenOfStore.getState()
        let flatObject = flatObjectStore.getState()

        for(let i = 0; i < nodesToUpdate.length; i++) {
            let { id, title, parentID, order } = destructInputNode(nodesToUpdate[i])
            let nodeData = { id, title, parentID, order }

            // add new node
            if(newState[id] === undefined) {
                if(addNonExistNodes) {
                    newState[id] = nodeData
                }
            }
            // update the exist one
            else {
                let nodeUpdate = {
                    ...newState[id],
                    ...extractDefinedValues(nodeData)
                }


                // check for parentID, it should not be
                // one of node children in any depth
                let parentID = nodeUpdate['parentID']
                let allNestedChildrenIDs = getAllNestedChildrenIDs(childrenOf[id])
                let illegalIDsAsParentID = allNestedChildrenIDs.concat(id)

                if(illegalIDsAsParentID.includes(parentID)) {
                    console.log(`Illegal parentID represented, parent ID '${parentID}' is not valid`)
                    continue
                }
                else {
                    newState[id] = nodeUpdate
                }
            }
        }

        return newState
    }
    const nodeMover = (state, nodesToMove, forceHaveIndex = false) => {
        let nodesToUpdate = []
        let flatObject = flatObjectStore.getState()
        let childrenOf = childrenOfStore.getState()

        for(let i = 0; i < nodesToMove.length; i++) {
            let data = nodesToMove[i]
            let id = data['id']
            let index = data['index']
            let parentID = data['parentID']
            let crossParentMove = true

            if(index < 0 || (forceHaveIndex && index === undefined)) {
                continue
            }

            let originalParentID = flatObject[id] ? flatObject[id]['parentID'] : undefined

            if(parentID === originalParentID || parentID === undefined) {
                crossParentMove = false
                parentID = originalParentID
            }
            
            let parentChildren = childrenOf[parentID] || []
            let originalIndex = parentChildren.findIndex(item => item['id'] === id)
            
            if(typeof index !== "number") {
                // no index represented, move the element
                // at the bottom of children if is crossParentMove
                if(crossParentMove) {
                    index = parentChildren.length
                }
                // no index, no parent change, so skip
                // this node
                else {
                    continue
                }
            }

            // skip extra update
            if(
                parentID === originalParentID &&
                (index === originalIndex || index === originalIndex + 1)
            ) {
                continue
            }


            // reorder all childs
            parentChildren = parentChildren.map((node, index) => ({
                ...node,
                order: index + 1
            }))
            let reorderUpdate = parentChildren.map(node => ({
                id: node['id'],
                order: node['order']
            }))
            nodesToUpdate = nodesToUpdate.concat(reorderUpdate)


            
            // calculate order
            let order = 1
            let prevPositionNode = parentChildren[index - 1]
            let samePositionNode = parentChildren[index]

            if(prevPositionNode) {
                order = prevPositionNode['order'] + 1
            }
            else if(samePositionNode) {
                order = samePositionNode['order']
            }
            else {
                if(parentChildren.length === 0) {
                    order = 1
                }
                else {
                    // illegal index represented, move item
                    // to the end of childrens
                    let lastIndex = parentChildren.length - 1

                    if(
                        parentID === originalParentID &&
                        (lastIndex === originalIndex || lastIndex === originalIndex + 1)
                    ) {
                        continue
                    }

                    let lastChildOrder = parentChildren[lastIndex]['order']
                    order = lastChildOrder + 1
                }
            }

            // add current item to update
            nodesToUpdate.push({
                id,
                order,
                parentID,
            })

            
            // increse all items order after the index by 1
            let itemsAfter = parentChildren.filter((item, i) => i >= index && item['id'] !== id)

            let afterItemsUpdates = itemsAfter.map(item => ({
                id: item['id'],
                order: item['order'] + 1
            }))

            nodesToUpdate = nodesToUpdate.concat(afterItemsUpdates)
        }

        let newState = nodeUpdater(state, nodesToUpdate, false)

        return newState

    }
    

    
    // instance api
    var API = {
        setData: (flatData) => {
            flatObjectStore.setState(() => flatListToFlatObject(flatData, destructInputNode))
        },
        prevState: () => flatObjectStore.prevState(),
        nextState: () => flatObjectStore.nextState(),
        getHistoryCount: () => flatObjectStore.getHistoryCount(),
        getCurrentHistoryNum: () => flatObjectStore.getCurrentHistoryNum(),
        bulkAddNodes: (nodesToAdd = []) => {
            flatObjectStore.setState(state => {
                let newState = { ...state }

                for(let i = 0; i < nodesToAdd.length; i++) {
                    let { id, title, parentID, order } = destructInputNode(nodesToAdd[i])
                    id = parseInt(id || Math.random() * 10000000000)
                    parentID = typeof parentID === "number" ? parentID : null

                    if(newState[id] !== undefined) {
                        console.log(`Node with ID '${id}' already exists`)
                        continue;
                    }
                    else {
                        newState[id] = { id, title, parentID, order }
                    }
                }

                newState = nodeMover(newState, nodesToAdd, true)

                return newState
            })
        },
        bulkDeleteNodes: (nodeIDsToRemove = [], removeDependentChildren = true) => {
            flatObjectStore.setState(state => {
                let newState = { ...state }
                let childrenOf = childrenOfStore.getState()
                let finalNodeIDsToRemove = []
                let finalNodeIDsToMoveUp = []

                if(removeDependentChildren) {
                    nodeIDsToRemove.forEach(id => {
                        let nodeChildren = childrenOf[id]
                        
                        if(nodeChildren === undefined) {
                            console.log(`Node with id '${id}' doesnt exists`)
                            returns
                        }
                        // add parent ID
                        finalNodeIDsToRemove.push(id)

                        traverseNodeChildren(nodeChildren, (child) => {
                            // add nested child ID
                            finalNodeIDsToRemove.push(child['id'])
                        })
                    })
                }
                else {
                    nodeIDsToRemove.forEach(id => {
                        let nodeChildren = childrenOf[id]

                        if(nodeChildren === undefined) {
                            console.log(`Node with id '${id}' doesnt exists`)
                            return
                        }

                        let targetNode = state[id]
                        let currentParentNodeID = targetNode['parentID']
                        let currentParentOrder = targetNode['order']

                        // add parent ID to remove
                        finalNodeIDsToRemove.push(id)

                        // add children IDs to move up
                        let childrenIDs = nodeChildren.map(node => ({
                            id: node['id'],
                            parentID: currentParentNodeID,
                            order: currentParentOrder,
                        }))
                        finalNodeIDsToMoveUp = finalNodeIDsToMoveUp.concat(childrenIDs)
                    })
                }
                
                // remove node IDs
                newState = filterObject(newState, (id) => !finalNodeIDsToRemove.includes(Number(id)))

                // move up nodes by updating
                newState = nodeUpdater(newState, finalNodeIDsToMoveUp, false)

                return newState
            })
        },
        bulkUpdateNodes: (nodesToUpdate = [], addNonExistNodes = false) => {
            flatObjectStore.setState(state => nodeUpdater(state, nodesToUpdate, addNonExistNodes))
        },
        bulkMoveNodes: (nodesToMove = []) => {
            flatObjectStore.setState(state => nodeMover(state, nodesToMove))
        },
        subscribeToStore: (storeType, unsubscribe = false, callback) => {
            let method = unsubscribe ? 'unsubscribe' : 'subscribe'

            switch(storeType) {
                case 'flat':
                    flatObjectStore[method](callback)
                    break
                case 'childrenOf':
                    childrenOfStore[method](callback)
                    break
                case 'tree':
                    treeStore[method](callback)
            }
            return API
        },
        getStoreState: (storeType) => {
            switch(storeType) {
                case 'flat':
                    return flatObjectStore.getState()
                case 'childrenOf':
                    return childrenOfStore.getState()
                case 'tree':
                    return treeStore.getState()
            }
        }
    }
    
    return API;

}

return {
    createTree,
}


})()