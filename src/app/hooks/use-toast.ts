"use client"

import * as React from "react"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 1000000

type ToastType = {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
  duration?: number
}

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let memoryState: ToastType[] = []

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToastType
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToastType>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: string
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: string
    }

function reducer(state: ToastType[], action: Action): ToastType[] {
  switch (action.type) {
    case "ADD_TOAST":
      return [
        ...state,
        action.toast,
      ]

    case "UPDATE_TOAST":
      return state.map((t) =>
        t.id === action.toast.id ? { ...t, ...action.toast } : t
      )

    case "DISMISS_TOAST": {
      const { toastId } = action

      if (toastId) {
        return state.map((t) =>
          t.id === toastId
            ? {
                ...t,
              }
            : t
        )
      } else {
        return state.map((t) => ({
          ...t,
        }))
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return []
      }
      return state.filter((t) => t.id !== action.toastId)
  }
}

const listeners: Array<(state: ToastType[]) => void> = []

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

function toast(props: Omit<ToastType, "id"> & { id?: string }) {
  const id = props.id || genId()

  const update = (props: ToastType) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<ToastType[]>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }