window.treeBundle = (() => {
'use strict'

function createTreeBundle(treeConfig, visualizerRootElement) {

    let treeInstance = treeImmutable.createTree(treeConfig)
    treeVisualizer.createTreeVisualizer({}, treeInstance, visualizerRootElement)

    const API = {
        setData: treeInstance.setData,
    }

    return API

}

return {
    createTreeBundle
}

})()