window.storeImmutable = (() => {
'use strict'



// shallow equal
const shallowEqual = (item1, item2) => {
    if(item1 === item2) return true

    if(typeof item1 === typeof item2 && typeof item1 === "object") {
        let item1Keys = Object.keys(item1)
        let item2Keys = Object.keys(item2)

        if(item1Keys.length !== item2Keys.length) return false
        if(Array.isArray(item1) !== Array.isArray(item2)) return false

        let anyValueDifference = false

        for(var key in item1) {
            if(!item1.hasOwnProperty(key)) continue
            if(item1[key] !== item2[key]) {
                anyValueDifference = true
                break
            }
        }

        if(!anyValueDifference) return true
    }

    return false
}




// store instance builder
function createStore(initState = {}) {
    let state = initState
    let history = [ initState ]
    let historyPointer = 0
    let listeners = []


    // on change
    const onChange = () => {
        listeners.forEach(callback => callback(state))
    }
    const changeHistoryPointer = (newPointIndex) => {
        if(newPointIndex < 0 || newPointIndex > history.length - 1) {
            return
        }

        state = history[newPointIndex]
        historyPointer = newPointIndex

        onChange()
    }
    const recordHistory = (newState) => {
        // if history is detached, so remove all
        // histories next to current detached one
        if(historyPointer !== history.length - 1) {
            history = history.filter((h, index) => index <= historyPointer)
        }
        history.push(newState)
        historyPointer ++
    }


    const API = {
        getState: () => state,
        setState: (callback) => {
            let newState = callback(state)
            
            if(shallowEqual(newState, state)) {
                console.log("nothing has changed (shallow comparision)")
                return
            }

            recordHistory(newState)
            state = newState
            onChange()
        },
        nextState: () => changeHistoryPointer(historyPointer + 1),
        prevState: () => changeHistoryPointer(historyPointer - 1),
        getHistoryCount: () => history.length,
        getCurrentHistoryNum: () => historyPointer + 1,
        subscribe: (listener) => {
            let alreadyExists = listeners.find(item => item === listener)

            if(alreadyExists) {
                console.log("listener already exists")
                return
            }
            else {
                listeners.push(listener)
            }
        },
        unsubscribe: (listener) => {
            let existsIndex = listeners.findIndex(item => item === listener)
            
            if(existsIndex < 0) {
                console.log("listener not found")
                return
            }
            else {
                listeners = [
                    ...listeners.slice(0, existsIndex),
                    ...listeners.slice(existsIndex + 1),
                ]
            }
        }
    }
    return API
}

return {
    createStore,
    shallowEqual,
}

})()