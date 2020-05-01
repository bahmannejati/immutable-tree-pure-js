window.overlay = (() => {
'use strict'

function showOverlay(element, content) {
    var holderElement = document.createElement('div')
    let rect = element.getBoundingClientRect()
    let targetLeft = rect.left
    let targetBottom = rect.bottom

    holderElement.style = `background-color: #fff; border: 1px solid #ccc; position: absolute;left: ${targetLeft}px; top: ${targetBottom}px`

    holderElement.innerHTML = `<div style="padding: 10px;">
        ${content}
    </div>`

    document.body.appendChild(holderElement)


    // helpers
    const remove = () => {
        holderElement.remove()
        holderElement.removeEventListener('click', holderClickListener)
        document.removeEventListener('click', documentClickListener)
    }

    
    // listeners
    let documentClickCounter = 0
    let holderClickCounter = 0

    const holderClickListener = (e) => {
        holderClickCounter ++
    }
    const documentClickListener = (e) => {
        documentClickCounter ++

        if(documentClickCounter - holderClickCounter > 1) {
            remove()
        }
    }
    
    // the order is important to work!
    holderElement.addEventListener('click', holderClickListener)
    document.addEventListener('click', documentClickListener)

    return {
        holderElement,
        remove
    }

}

return {
    showOverlay,
}

})()