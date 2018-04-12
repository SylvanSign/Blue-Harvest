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
      ')');
  })

  // Render the graph with our customized graphics object:
  const renderer = Viva.Graph.View.renderer(graph, {
    graphics: graphics,
    container: document.getElementById('graph-container'),
    layout: Viva.Graph.Layout.forceDirected(graph, {
      gravity: -10,
      springCoeff: 0.001,
      dragCoeff: 0.05,
      springTransform(link, spring) {
        spring.length = (100 - link.data.overlap) * 2
      }
    }),
  })
  renderer.run()
}

window.c = createPopup

function createPopup(node) {
  const {
    id,
    data: {
      description,
    },
  } = node

  const f = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')
  f.setAttribute('width', ICON_SIZE * 8)
  // f.setAttribute('height', ICON_SIZE * 2)
  // f.setAttribute('x', `-${ICON_SIZE / 2}px`)
  f.setAttribute('y', `${ICON_SIZE}px`)

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
  // just enumerate all realted nodes and update link color:
  graph.forEachLinkedNode(nodeId, (node, link) => {
    const linkUI = graphics.getLinkUI(link.id);
    if (linkUI) {
      // linkUI is a UI object created by graphics below
      linkUI.attr('stroke', isOn ? 'red' : 'gray');
    }
  });
};

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

    if (!data.explored) {
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

      // TODO uncomment if we want perma-labels
      // const text = Viva.Graph.svg('text')
      //   .attr('y', '-8px')
      //   .text(node.id)

      // // delay this to event loop to ensure we can read text BBox
      // setTimeout(() => {
      //   const {
      //     x,
      //     y,
      //     width,
      //     height
      //   } = text.getBBox()
      //   const rect = Viva.Graph.svg('rect')
      //     .attr('x', x)
      //     .attr('y', y)
      //     .attr('width', width)
      //     .attr('height', height)
      //     .attr('fill', '#fff')
      //   text.remove()
      //   ui.append(rect)
      //   ui.append(text)
      // }, 0)
      // ui.append(text)

      for (const site in similarSites) {
        const overlap = similarSites[site]
        addNode(site)
        setTimeout(() => addLink(id, site, {
          overlap
        }), 750)
      }
    }

    // activePopup.remove()
    highlightRelatedNodes(activeId, false);

    if (activeId !== id) {
      highlightRelatedNodes(node.id, true)
      // activePopup = createPopup(node)

      // make sure to reorder this ui as last node so it draws on top of rest of graph
      const parentUI = ui.parentElement
      ui.remove()
      parentUI.appendChild(ui)

      ui.appendChild(activePopup)
      activeId = id
    } else {
      // this plus the if clause allows us to toggle popup by clicking the current id's image/icon
      activeId = null
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
