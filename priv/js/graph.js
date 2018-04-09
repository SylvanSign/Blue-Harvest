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
initializeGraph()

function initializeGraph() {
  // This function let us override default node appearance and create
  // something better than blue dots:
  graphics.node(node => {
    const ui = Viva.Graph.svg('g')

    const img = Viva.Graph.svg('image')
      .attr('width', ICON_SIZE)
      .attr('height', ICON_SIZE)
      .link('/images/question_mark.svg')

    ui.addEventListener('touchend', makeNodeClickHandler({
      node,
      ui,
    }))
    ui.addEventListener('click', makeNodeClickHandler({
      node,
      ui,
    }))

    ui.append(img)
    return ui
  })

  graphics.placeNode((nodeUI, pos) => {
    // 'g' element doesn't have convenient (x,y) attributes, instead
    // we have to deal with transforms: http://www.w3.org/TR/SVG/coords.html#SVGGlobalTransformAttribute
    nodeUI.attr('transform',
      'translate(' +
      (pos.x - HALF_ICON_SIZE) + ',' + (pos.y - HALF_ICON_SIZE) +
      ')');
  })

  // Render the graph with our customized graphics object:
  const springLength = ICON_SIZE * 6
  const renderer = Viva.Graph.View.renderer(graph, {
    graphics: graphics,
    container: document.getElementById('graph-container'),
    layout: Viva.Graph.Layout.forceDirected(graph, {
      springLength,
      gravity: -30,
      // springCoeff: 0.0005,
      springTransform(link, spring) {
        spring.length = springLength * (1 - (link.data.overlap / 100));
      }
    }),
  })
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

    const {
      id,
      data,
    } = node

    if (data.explored) {
      // TODO maybe render the popup, but skip exploring
      return
    } else {
      const img = ui.querySelector('image')
      img.link('/images/spinner.gif')
      const [similarSites, description] = await Promise.all([
        fetchSimilarSites(node.id),
        fetchDescription(node.id),
      ])

      Object.assign(data, {
        explored: true,
        similarSites,
        description,
      })
      img.link(createImageUrl(id))
      const text = Viva.Graph.svg('text')
        .attr('x', `${-4 - ICON_SIZE / 2}px`)
        .attr('y', '-8px')
        .text(node.id)

      // delay this to event loop to ensure we can read text BBox
      setTimeout(() => {
        const {
          x,
          y,
          width,
          height
        } = text.getBBox()
        const rect = Viva.Graph.svg('rect')
          .attr('x', x)
          .attr('y', y)
          .attr('width', width)
          .attr('height', height)
          .attr('fill', '#fff')
        text.remove()
        ui.append(rect)
        ui.append(text)
      }, 0)
      ui.append(text)

      for (const site in similarSites) {
        const overlap = similarSites[site]
        addNode(site)
        setTimeout(() => addLink(id, site, {
          overlap
        }), 750)
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
