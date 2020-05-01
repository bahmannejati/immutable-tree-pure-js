window.treeVisualizer = (() => {

'use strict'

const DEFAULT_CONFIG = {
}
const extendConfig = (config, newConfig) => {
    Object.assign(config, {
        ...DEFAULT_CONFIG,
        ...newConfig
    })
}


function createTreeVisualizer(
    config,
    treeInstance,
    rootElement,
) {
    if(!treeInstance || !rootElement) {
        throw new Error('what are you doing? we need tree instance')
    }

    // extend config
    const CONFIG = {}
    extendConfig(CONFIG, config)


    const showOverlay = window.overlay.showOverlay


    // add dom events
    const getElementParentNodeData = (element) => {
        let parentNodeElement = element.closest(".node-holder")

        if(!parentNodeElement) {
            return null
        }

        let nodeID = Number(parentNodeElement.dataset.nodeId) || null
        let index = Number(parentNodeElement.dataset.index)
        let flatData = treeInstance.getStoreState('flat')
        let childrenOfData = treeInstance.getStoreState('childrenOf')
        let node = flatData[nodeID] || {}

        let children = childrenOfData[nodeID] || []
        let childrenCount = children.length

        return {
            id: nodeID,
            title: node['title'],
            parentID: node['parentID'],
            order: node['order'],
            index,
            children,
            childrenCount,
        }
    }
    const onDOMContentLoad = () => {
        rootElement.addEventListener('click', (e) => {
            let nodeClass = e.target.classList
            let contains = nodeClass.contains.bind(nodeClass)
            let nodeData = getElementParentNodeData(e.target)
            
            if(contains('edit-node')) {
                handleOnEdit(nodeData, e.target)
            }
            else if(contains('add-node')) {
                handleOnAdd(nodeData, e.target)
            }
            else if(contains('delete-node')) {
                handleOnDelete(nodeData, e.target)
            }
            else if(contains('add-node-to-root')) {
                handleOnAdd(nodeData, e.target)
            }
            else if(contains('prev-state')) {
                treeInstance.prevState()
            }
            else if(contains('next-state')) {
                treeInstance.nextState()
            }
        })



        
        // start/end of drag operation
        rootElement.addEventListener('dragstart', (e) => {
            let nodeData = getElementParentNodeData(e.target)
            let dragNodeID = nodeData['id']
            e.dataTransfer.setData("dragNodeID", dragNodeID)

            rootElement.classList.add('root-dragging')
        })
        rootElement.addEventListener('dragend', (e) => {
            rootElement.classList.remove('root-dragging')
        })
        rootElement.addEventListener('mouseup', (e) => {
            rootElement.classList.remove('root-dragging')
        })

        

        // drag over/leave events
        rootElement.addEventListener('dragover', (e) => {
            let classList = e.target.classList
            classList.add('dragover')

            e.preventDefault()
        })
        rootElement.addEventListener('dragleave', (e) => {
            let classList = e.target.classList
            classList.remove('dragover')
        })


        // drop, move the elements
        rootElement.addEventListener('drop', (e) => {
            let classList = e.target.classList
            let contains = classList.contains.bind(classList)
            classList.remove('dragover')

            let parentNodeData = null
            let parentID = null
            let index = null
            let id = Number(e.dataTransfer.getData("dragNodeID"))
            let shouldMove = false
            
            if(contains('dragover-cover') || contains('drop-index-zone')) {
                shouldMove = true
                parentNodeData = getElementParentNodeData(e.target)
                parentID = parentNodeData['id']
            }

            if(contains('dragover-cover')) {
                index = undefined
            }
            else if(contains('drop-index-zone')) {
                index = Number(e.target.dataset.index)
            }

            if(shouldMove) {
                treeInstance.bulkMoveNodes([
                    {
                        id,
                        index,
                        parentID
                    }
                ])
            }

        })


        // initial render
        renderHTML()
    }
    const handleOnEdit = (nodeData, originElement) => {
        let overlayHTML = `
            <div>
                <input type="text" value="${nodeData['title']}" class="title-input" />
                <button class="update-button">update</button>
                <button class="cancel-button">cancel</button>
            </div>
        `
        let { holderElement, remove } = showOverlay(originElement, overlayHTML)

        holderElement.addEventListener('click', (e) => {
            let targetNode = e.target
            let contains = targetNode.classList.contains.bind(targetNode.classList)

            if(contains('update-button')) {
                let newTitle = holderElement.querySelector(".title-input").value
                newTitle = newTitle.trim()

                if(newTitle === '') {
                    return
                }

                treeInstance.bulkUpdateNodes([
                    {
                        id: nodeData['id'],
                        title: newTitle,
                    }
                ])
                remove()
            }
            else if(contains('cancel-button')) {
                remove()
            }
        })
    }
    const handleOnAdd = (nodeData, originElement) => {
        let children = nodeData['children']

        let positionOptionsHTML = `<option value="0" selected>begining</option>`
        positionOptionsHTML += children.slice(0, -1).map((node, index) => `<option value="${index + 1}">after ${node['title']}</option>`).join('')

        if(children.length) {
            positionOptionsHTML += `<option value="${children.length}">end</option>`
        }

        let overlayHTML = `
            <div>
                <input type="text" class="title-input" />
                <br />
                <br />
                <select class="index-select" style="min-width: 100px;" placeholder="select position">
                    ${positionOptionsHTML}
                </select>
            </div>
            <br />
            <div>
                <button class="add-button">insert</button>
                <button class="cancel-button">cancel</button>
            </div>
        `

        let { holderElement, remove } = showOverlay(originElement, overlayHTML)
        
        holderElement.addEventListener('click', (e) => {
            const contains = e.target.classList.contains.bind(e.target.classList)

            if(contains('cancel-button')) {
                remove()
            }
            else if(contains('add-button')) {
                let title = holderElement.querySelector(".title-input").value
                title = title.trim()

                if(title === "") {
                    return
                }

                let index = Number(holderElement.querySelector(".index-select").value)
                let newID = parseInt(Math.random() * 10000000000)

                treeInstance.bulkAddNodes([
                    {
                        id: newID,
                        title,
                        parentID: nodeData['id'] || null,
                        index
                    }
                ])
                remove()
            }
        })
    }
    const handleOnDelete = (nodeData, originElement) => {
        let children = nodeData['children']
        let removeDependentHTML = ``
        if(children.length) {
            removeDependentHTML = `
                <br />
                <br />
                <label>
                    <input type="checkbox" class="remove-dependent" />
                    remove children
                </label>
            `
        }

        let overlayHTML = `
            <div>
                Do you want to delete node?
                ${removeDependentHTML}
            </div>
            <br />
            <div>
                <button class="accept-button">Yes do it</button>
                <button class="cancel-button">cancel</button>
            </div>
        `

        let { holderElement, remove } = showOverlay(originElement, overlayHTML)
        
        holderElement.addEventListener('click', (e) => {
            const contains = e.target.classList.contains.bind(e.target.classList)

            if(contains('cancel-button')) {
                remove()
            }
            else if(contains('accept-button')) {
                let checkbox = holderElement.querySelector(".remove-dependent")
                let removeDependent = checkbox ? checkbox.checked : false

                treeInstance.bulkDeleteNodes([ nodeData['id'] ], removeDependent)
                remove()
            }
        })
    }



    // init dom listener
    document.addEventListener('DOMContentLoaded', onDOMContentLoad)
    
    if(document.readyState === 'interactive' || document.readyState === 'complete') {
        onDOMContentLoad()
    }
    



    // subscribe for change
    treeInstance.subscribeToStore('flat', false, (state) => {
        renderHTML()
    })


    // render HTML
    const renderHTML = () => {
        let treeData = treeInstance.getStoreState('tree') || []

        let emptyHTML = treeData.length === 0 ? `
            <div>
                nothing here!
            </div>
        ` : ''

        let HTML = `
            <div>
                <button class="prev-state">
                    prev state
                </button>
                ${treeInstance.getCurrentHistoryNum()}/${treeInstance.getHistoryCount()}
                <button class="next-state">
                    next state
                </button>
            </div>
            <br />
            <br />
            <br />

            <div class="node-holder" data-node-id="null" data-index="0">
                ${createRecursiveTree(treeData)}
                <div>
                    ${emptyHTML}
                    <br />
                    <br />
                    <br />
                    <button class="add-node-to-root">add node to root</button>
                    <style>
                        .root-dragging .dragover-cover {
                            position: absolute;
                            left: 0;
                            right: 0;
                            top: 0;
                            bottom: 0;
                        }
                        .root-dragging .dragover-cover.dragover {
                            background-color: rgba(255, 235, 0, 0.3);
                        }
                        .drop-index-zone.dragover {
                            background-color: rgba(255, 235, 0, 0.8);
                        }
                    </style>
                </div>
            </div>
        `
        rootElement.innerHTML = HTML
    }
    const createRecursiveTree = (treeArray) => {
        let lastChildIndex = treeArray.length - 1
        
        let HTMLArray = treeArray.map((node, index) => {
            let children = node['children']
            let childHTML = createRecursiveTree(children)

            return `
                <div class="drop-index-zone" style="height: 10px;" data-index="${index}"></div>
                <div class="node-holder" data-node-id="${node['id']}" data-index="${index}" draggable="true">
                    <div style="position: relative;">
                        <div class="dragover-cover"></div>
                        ${node['title']}
                        <button class="edit-node" title="edit">~</button>
                        <button class="add-node" title="add child">+</button>
                        <button class="delete-node" title="delete">-</button>
                    </div>
                    <div style="margin-left: 50px;">
                        ${childHTML}
                    </div>
                </div>
                ${index === lastChildIndex ? `<div class="drop-index-zone after-zone" style="height: 10px;" data-index="${index + 1}"></div>` : ''}
            `
        })
        return HTMLArray.join('')
    }



    const API = {
        rerender: renderHTML,
    }

    return API

}

return {
    createTreeVisualizer,
}
    
})()