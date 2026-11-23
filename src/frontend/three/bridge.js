// Shared between the DOM sections and the 3D stage.

// DOM label elements the anatomy section registers; the stage moves them
// to the projected screen position of each part every frame.
export const anatomyLabels = new Map()

// The flight path, sampled in pixels relative to the pinned flight stage.
export const flightPath = { pts: [], ready: false, stageW: 0, stageH: 0, offsetY: 0 }

// The craft section's callouts (id -> { el, def }) and its section and pinned
// stage elements; the stage positions the callouts and the glow every frame.
export const craftMarks = new Map()
export const craftStage = { el: null, section: null }

// Product cards report hover here (by id) for the card views.
export const productHover = new Map()
