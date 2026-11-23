import 'server-only'
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises'
import path from 'node:path'
import { env } from '../config/env.js'

// A tiny document store: one JSON file per collection under ARROW_DATA_DIR.
// It is the persistence placeholder until a real database is chosen; services
// only use the collection interface (insert / list / findOne), so swapping it
// for Postgres, Firebase, etc. means replacing this file alone.
//
// If the disk is not writable (serverless hosts), it keeps records in memory
// for the life of the process and logs a warning once.

const collections = new Map()
let diskOk = true

function fileFor(name) {
  return path.join(env.dataDir, `${name}.json`)
}

async function load(name) {
  if (collections.has(name)) return collections.get(name)
  let docs = []
  try {
    docs = JSON.parse(await readFile(fileFor(name), 'utf8'))
    if (!Array.isArray(docs)) docs = []
  } catch (err) {
    if (err.code !== 'ENOENT') console.warn(`[store] could not read ${name}:`, err.message)
  }
  const state = { docs, queue: Promise.resolve() }
  collections.set(name, state)
  return state
}

async function persist(name, docs) {
  if (!diskOk) return
  try {
    await mkdir(env.dataDir, { recursive: true })
    const tmp = fileFor(name) + '.tmp'
    await writeFile(tmp, JSON.stringify(docs, null, 2))
    await rename(tmp, fileFor(name))
  } catch (err) {
    diskOk = false
    console.warn(`[store] disk not writable (${err.code ?? err.message}); keeping data in memory only.`)
  }
}

export function collection(name) {
  return {
    async insert(doc) {
      const state = await load(name)
      // Writes are serialised per collection so concurrent requests never
      // overwrite each other's file contents.
      state.queue = state.queue.then(async () => {
        state.docs.push(doc)
        await persist(name, state.docs)
      })
      await state.queue
      return doc
    },
    async list() {
      return [...(await load(name)).docs]
    },
    async findOne(predicate) {
      return (await load(name)).docs.find(predicate) ?? null
    },
  }
}
