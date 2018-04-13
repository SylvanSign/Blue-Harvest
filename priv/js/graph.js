'use strict'

const Viva = require('vivagraphjs')
const {
  fetchDescription,
  fetchImage,
  fetchSimilarSites,
} = require('./serverApi')

const ICON_SIZE = 32 // px
const HALF_ICON_SIZE = ICON_SIZE / 2

const graph = Viva.Graph.graph()
const graphics = Viva.Graph.View.svgGraphics()
let activeId
let activePopup
resetCurrentPopup()
initializeGraph()

function resetCurrentPopup() {
  activePopup = {
    remove() {} // Hacky way to initialize a faux dom node
  }
}

function initializeGraph() {
  // This function let us override default node appearance and create
  // something better than blue dots:
  graphics.node(node => {
    const ui = Viva.Graph.svg('g')

    const backOfImage = Viva.Graph.svg('rect')
      .attr('width', ICON_SIZE)
      .attr('height', ICON_SIZE)
      .attr('fill', '#fff')
    ui.append(backOfImage)

    const img = Viva.Graph.svg('image')
      .attr('width', ICON_SIZE)
      .attr('height', ICON_SIZE)
      .link('/images/question_mark.svg')
    ui.append(img)

    img.addEventListener('touchend', makeNodeClickHandler({
      node,
      ui,
    }))
    img.addEventListener('click', makeNodeClickHandler({
      node,
      ui,
    }))

    return ui
  })

  graphics.placeNode((nodeUI, pos) => {
    // 'g' element doesn't have convenient (x,y) attributes, instead
    // we have to deal with transforms: http://www.w3.org/TR/SVG/coords.html#SVGGlobalTransformAttribute
    nodeUI.attr('transform',
      'translate(' +
      (pos.x - HALF_ICON_SIZE) + ',' + (pos.y - HALF_ICON_SIZE) +
      ')')
  })

  // Render the graph with our customized graphics object:
  const renderer = Viva.Graph.View.renderer(graph, {
    graphics: graphics,
    container: document.getElementById('graph-container'),
    layout: Viva.Graph.Layout.forceDirected(graph, {
      gravity: -50,
      springCoeff: 0.0001,
      dragCoeff: 0.05,
      springTransform(link, spring) {
        spring.length = (100 - link.data.overlap) * 2
      },
    }),
  })
  renderer.run()
}

function createPopup(node) {
  const {
    id,
    data: {
      description,
    },
  } = node

  const f = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')
  f.setAttribute('width', ICON_SIZE * 8)
  f.setAttribute('y', ICON_SIZE)

  const hyperLink = createHyperLink(id)

  const p = document.createElement('p')
  p.classList.add('infoPopup')
  const a = document.createElement('a')
  a.setAttribute('href', hyperLink)
  a.setAttribute('target', `_blank`)
  a.setAttribute('rel', `noopener noreferrer`)
  a.textContent = id
  a.addEventListener('touchend', () => {
    const newWindow = window.open()
    newWindow.opener = null
    newWindow.location = hyperLink
  })
  p.appendChild(a)
  p.appendChild(document.createElement('br'))
  p.appendChild(document.createTextNode(description))

  f.appendChild(p)

  return f
}

function highlightRelatedNodes(nodeId, isOn) {
  const ui = graphics.getNodeUI(nodeId)
  ui.querySelector('#bgLabel').attr('visibility', isOn ? 'visible' : 'hidden')
  ui.querySelector('text').attr('visibility', isOn ? 'visible' : 'hidden')
  // just enumerate all realted nodes and update link color:
  graph.forEachLinkedNode(nodeId, (node, link) => {
    const linkUI = graphics.getLinkUI(link.id)
    if (linkUI) {
      // linkUI is a UI object created by graphics below
      linkUI.attr('stroke', isOn ? 'red' : 'gray')
      if (node.data.explored) {
        const linkedNodeUI = graphics.getNodeUI(node.id)
        linkedNodeUI.querySelector('#bgLabel').attr('visibility', isOn ? 'visible' : 'hidden')
        linkedNodeUI.querySelector('text').attr('visibility', isOn ? 'visible' : 'hidden')
      }
    }
  })
}

function createHyperLink(id) {
  return `http://${id}`
}

function createImageUrl(site) {
  return `/image?site=${site}`
}

function makeNodeClickHandler(params) {
  const {
    node,
    ui,
  } = params

  return async function (event) {
    if (event) {
      event.preventDefault()
    }

    const {
      id,
      data,
    } = node

    let renderPromise = Promise.resolve();
    if (!data.explored) {
      const img = ui.querySelector('image')
      img.link('/images/spinner.gif')
      const [similarSites, description] = await Promise.all([
        fetchSimilarSites(id),
        fetchDescription(id),
      ])

      Object.assign(data, {
        explored: true,
        similarSites,
        description,
      })

      const similarNodePromises = []
      for (const site in similarSites) {
        if (!hasNode(site) || !hasLink(site, id)) {
          const overlap = similarSites[site]
          const similarPromise = delayPromise()
            .then(() => createNodeSpawnPromise({
              id,
              site,
              overlap,
            }))
          similarNodePromises.push(similarPromise)
        }
      }
      renderPromise = new Promise(resolve => {
        Promise.all(similarNodePromises)
          .then(() => delayPromise(500))
          .then(() => {
            img.link(createImageUrl(id))
            // TODO uncomment
            // if we want perma - labels
            const text = Viva.Graph.svg('text')
              .attr('y', '-8px')
              .text(id)
              .attr('visibility', 'hidden')

            // delay this to event loop to ensure we can read text BBox
            setTimeout(() => {
              const {
                y,
                width,
                height
              } = text.getBBox()
              // computing x after rendering to center the label
              const x = -(width - ICON_SIZE) / 2
              text.attr('x', x)
              const rect = Viva.Graph.svg('rect')
                .attr('x', x)
                .attr('y', y)
                .attr('width', width)
                .attr('height', height)
                .attr('fill', '#fff')
                .attr('id', 'bgLabel')
                .attr('visibility', 'hidden')

              text.remove()
              ui.append(rect)
              ui.append(text)
              resolve()
            }, 0)
            ui.append(text)
          })
      })

    }

    renderPromise.then(() => {
      if (activeId) {
        highlightRelatedNodes(activeId, false)
      }
      if (activeId !== id) {
        highlightRelatedNodes(id, true)

        // make sure to reorder this ui as last node so it draws on top of rest of graph
        // const parentUI = ui.parentElement
        // ui.remove()
        // parentUI.appendChild(ui)

        activeId = id
      } else {
        // this plus the if clause allows us to toggle popup by clicking the current id's image/icon
        activeId = null
      }
    })
  }
}

function createNodeSpawnPromise(params) {
  const {
    id,
    site,
    overlap,
  } = params
  return delayPromise()
    .then(() => {
      addLink(id, site, {
        overlap
      })
      addNode(site)
    })
}

function delayPromise(ms = Math.random() * 1000) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function addNode(id, data = {}) {
  const node = hasNode(id)
  if (!node || !node.data) { // TODO should use graph.hasNode eventually
    graph.addNode(id, data)
  }
}

function hasNode(id) {
  return graph.getNode(id)
}

function hasLink(fromId, toId) {
  return graph.getLink(fromId, toId)
}

function addLink(fromId, toId, data = {}) {
  if (!hasLink(fromId, toId)) { // TODO should use graph.hasLink eventually
    graph.addLink(fromId, toId, data)
  }
}

function activateNode(id) {
  makeNodeClickHandler({
    node: graph.getNode(id),
    ui: graphics.getNodeUI(id)
  })()
}

function clearGraph() {
  graph.clear()
}

module.exports = {
  addNode,
  addLink,
  activateNode,
  clearGraph,
}
