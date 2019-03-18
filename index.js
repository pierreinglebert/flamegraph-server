'use strict'

const fs = require('fs').promises
const path = require('path')
const Koa = require('koa')
const Router = require('koa-router')
const child_process = require('child_process')
const flamebearer = require('flamebearer')

const app = new Koa()

const LOG_DIR = process.env.LOG_DIR || './logs'

const router = new Router()

router.get('/', async (ctx) => {
    ctx.response.type = 'html'
    ctx.body = await fs.readFile('./index.html')
})

router.get('/isolates', async (ctx) => {
    const filenames = await fs.readdir(LOG_DIR)
    const files = []
    for(const filename of filenames) {
        const stat = await fs.stat(path.join(LOG_DIR, filename))
        files.push({
            id: filename,
            name: filename.replace(/^isolate-/, '').replace(/\.log$/, ''),
            date: stat.ctime
        })
    }
    ctx.body = files.sort((a,b) => b.date.getTime() - a.date.getTime())
})

router.get('/isolates/:id', async (ctx) => {
    if (ctx.accepts('html')) {
        ctx.response.type = 'html'
        ctx.body = await fs.readFile('./isolate.html')
    } else {
        const filename = ctx.params.id
        // Call node
        const out = await new Promise((res, rej) => child_process.exec('node --prof-process --preprocess -j ' + path.join(LOG_DIR, filename), {maxBuffer: 1024 * 1024 * 500}, (err, stdout) => err? rej(err): res(stdout)))
        const json = JSON.parse(out)
        const {names, stacks} = flamebearer.v8logToStacks(json)
        ctx.body = {
            names: names,
            levels: flamebearer.mergeStacks(stacks),
            numTicks: stacks.length
        }
    }
})

app.use(router.routes()).use(router.allowedMethods())

app.listen(process.env.PORT || 80)
