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
window.g = graph
const graphics = Viva.Graph.View.svgGraphics()
initializeGraph()

function initializeGraph() {
  // This function let us override default node appearance and create
  // something better than blue dots:
  graphics.node(node => {
    const ui = Viva.Graph.svg('image')
      .attr('width', ICON_SIZE)
      .attr('height', ICON_SIZE)
      .link('/images/blank_black.png')

    ui.addEventListener('touchend', makeNodeClickHandler({
      node,
      ui
    }))
    ui.addEventListener('click', makeNodeClickHandler({
      node,
      ui
    }))

    return ui
  })

  graphics.placeNode((nodeUI, pos) => {
    // nodeUI - is exactly the same object that we returned from
    //   node() callback above.
    // pos - is calculated position for this node.
    nodeUI.attr('x', pos.x - HALF_ICON_SIZE).attr('y', pos.y - HALF_ICON_SIZE)
  })

  // Render the graph with our customized graphics object:
  const renderer = Viva.Graph.View.renderer(graph, {
    graphics: graphics,
    container: document.getElementById('graph-container'),
    layout: Viva.Graph.Layout.forceDirected(graph, {
      springLength: ICON_SIZE * 4,
      gravity: -30,
      // springCoeff: 0.0005,
      // dragCoeff: 0.02,
    }),
  })
  window.r = renderer

  renderer.run()
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
    console.log(node)

    const {
      id,
      data,
    } = node

    if (data.explored) {
      // TODO maybe render the popup, but skip exploring
      return
    } else {
      ui.link('/images/blank_red.png')
      const [similarSites, description] = await Promise.all([
        fetchSimilarSites(node.id),
        fetchDescription(node.id),
      ])

      Object.assign(data, {
        explored: true,
        similarSites,
        description,
      })
      ui.link(createImageUrl(id))

      for (const site of similarSites) {
        addNode(site)
        setTimeout(() => addLink(id, site), 750)
      }
    }
  }
}

function addNode(id, data = {}) {
  if (!graph.getNode(id)) { // TODO should use hasNode eventually
    graph.addNode(id, data)
  }
}

function addLink(fromId, toId, data = {}) {
  if (!graph.getLink(fromId, toId)) { // TODO should use hasLink eventually
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
