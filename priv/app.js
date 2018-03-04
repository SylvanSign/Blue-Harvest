const graph = require('ngraph.graph')();
window.graph = graph // for debugging in browser
const renderGraph = require('ngraph.pixel');

const Colors = {
  START: 0x0A25E2,
  UNEXPLORED: 0xFFFFFF,
  EXPLORED: 0xCBFF00,
  CURRENT: 0xFB0000,
  START_IS_CURRENT: 0xFF00FF,
}

const siteLabel = document.querySelector("#siteLabel")
const descriptionLabel = document.querySelector("#descriptionLabel")

function setSiteLabel(text) {
  siteLabel.textContent = text
}

function setDescriptionLabel(text) {
  descriptionLabel.textContent = text
}

function hasNode(id) {
  return graph.hasNode(id)
}

function hasLink(fromId, toId) {
  return graph.hasLink(fromId, toId)
}

function addNode(id, data) {
  graph.addNode(id, data)
}

function addLink(fromId, toId, data) {
  graph.addLink(fromId, toId, data)
}

const siteName = location.hash && location.hash.slice(1) || "google.com"
addNode(siteName, {
  start: true,
  explored: false,
})
let currentSite = siteName

const renderer = renderGraph(graph, {
  node(node) {
    return getNodeUIDetails(node)
  }
});

renderer.on('nodeclick', nodeclickHandler);

async function nodeclickHandler(node) {
  if (node) {
    const {
      data,
    } = node

    if (!data.explored) {
      const explorationData = await explore(node)
      Object.assign(node.data, explorationData)
    }

    setSiteLabel(node.id)
    setDescriptionLabel(data.description)

    move(currentSite, node.id)
  }
}

function move(fromId, toId) {
  currentSite = toId

  const fromNode = graph.getNode(fromId)
  const fromNodeUI = renderer.getNode(fromId)
  Object.assign(fromNodeUI, getNodeUIDetails(fromNode))

  const toNode = graph.getNode(toId)
  const toNodeUI = renderer.getNode(toId)
  Object.assign(toNodeUI, getNodeUIDetails(toNode))
}

function getNodeUIDetails(node) {
  const {
    data
  } = node

  let color
  if (node.id === currentSite) {
    color = data.start ? Colors.START_IS_CURRENT : Colors.CURRENT
    size = 30
  } else if (data.start) {
    color = Colors.START
    size = 20
  } else if (data.explored) {
    color = Colors.EXPLORED
    size = 20
  } else {
    color = Colors.UNEXPLORED
    size = 20
  }

  return {
    color,
    size,
  };
}

async function explore(node) {
  const data = {}
  data.explored = true
  const [similarSites, description] = await Promise.all([
    fetchSimilarSites(node.id),
    fetchDescription(node.id),
  ])
  data.similarSites = similarSites
  data.description = description

  for (const site of similarSites) {
    if (!hasNode(site)) {
      addNode(site, {
        explored: false
      })
    }
    if (!hasLink(node.id, site)) {
      addLink(node.id, site)
    }
  }

  renderer.stable(false)
  return data
}

// Logic
async function fetchSimilarSites(site) {
  if (site === '') {
    throw new Error("fetchSimilarSites called with empty site")
  }
  const response = await fetch(`/similar-sites?site=${encodeURIComponent(site)}`)
  const {
    similarSites
  } = await response.json()
  return similarSites
}

async function fetchDescription(site) {
  if (site === '') {
    throw new Error("fetchDescription called with empty site")
  }
  try {
    const response = await fetch(`/description?site=${encodeURIComponent(site)}`)
    console.log(response)
    const {
      description
    } = await response.json()
    return description;
  } catch (err) {
    return "Sorry, we couldn't find a description for this site!" // description is a "nice to have"
  }
}

window.addEventListener("keydown", e => {
  const SPACE_BAR = 32
  if (e.keyCode === SPACE_BAR) {
    renderer.autoFit()
  }
})
