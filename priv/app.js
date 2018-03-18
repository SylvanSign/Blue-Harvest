const graph = require('ngraph.graph')();
window.graph = graph // for debugging in browser
const renderGraph = require('ngraph.pixel');

const TIME_TO_STABALIZE_IN_MS = 3000

const AUTO_EXPLORE_INTERVAL = 1000 // ms
let exploreQueue
let autoExploring
let currentSite
let renderer
let stabalizeTimeout

const Colors = {
  START: 0x0A25E2,
  UNEXPLORED: 0xFFFFFF,
  EXPLORED: 0xCBFF00,
  CURRENT: 0xFB0000,
  START_IS_CURRENT: 0xFF00FF,
}

const siteLabel = document.querySelector("#siteLabel")
const descriptionLabel = document.querySelector("#descriptionLabel")
const icon = document.querySelector("#icon")
const controlsInfo = document.querySelector("#controls")
const autoExploreWarning = document.querySelector("#autoExploreWarning")
// disable right click menu so it doesn't ruin the immersion
document.querySelector("body").addEventListener('contextmenu', event => event.preventDefault())

window.addEventListener("keydown", e => {
  const SPACE_BAR = 32
  const ESCAPE = 27
  const G = 71
  const P = 80
  switch (e.keyCode) {
    case SPACE_BAR:
      renderer.autoFit()
      break
    case ESCAPE:
      controls.hidden = !controls.hidden
      break
    case G:
      renderer.showNode(currentSite)
      break
    case P:
      toggleAutoExplore()
      break
  }
})

reset(location.hash && location.hash.slice(1) || "google.com")

function reset(siteName) {
  currentSite = siteName
  exploreQueue = []
  autoExploring = false

  addNode(siteName, {
    start: true,
    explored: false,
  })

  exploreQueue.push(graph.getNode(siteName))

  renderer = renderGraph(graph, {
    is3d: true, // change to false to render a "flat graph in 3D"
    node(node) {
      return getNodeUIDetails(node)
    },
  });

  renderer.on('nodeclick', nodeclickHandler);
}

function toggleAutoExplore() {
  autoExploring = !autoExploring
  autoExploreWarning.hidden = !autoExploreWarning.hidden
  if (autoExploring) {
    populateExploreQueue()
    autoExplore()
  }
}

function populateExploreQueue() {
  graph.forEachNode(node => {
    const {
      data: {
        explored
      }
    } = node
    if (!explored) {
      exploreQueue.push(node)
    }
  })
}

async function autoExplore() {
  if (autoExploring) {
    const nextNodeToExplore = getNextNodeToExplore()
    await nodeclickHandler(nextNodeToExplore)
    if (autoExploring) {
      setTimeout(autoExplore, AUTO_EXPLORE_INTERVAL)
    }
  }
}

function getNextNodeToExplore() {
  const nextNode = exploreQueue.shift()
  if (!nextNode) {
    return null
  }

  const {
    data: {
      explored
    }
  } = nextNode
  return explored ? getNextNodeToExplore() : nextNode
}

function setSiteLabel(text) {
  siteLabel.href = `http://${text}`
  siteLabel.textContent = text
}

function setDescriptionLabel(text) {
  descriptionLabel.textContent = text
}

function setIcon(image) {
  if (image === "") {
    icon.hidden = true;
  } else {
    icon.hidden = false;
    icon.src = 'data:image/jpeg;base64,' + image;
  }

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

async function nodeclickHandler(node) {
  if (node) {
    const {
      data,
    } = node

    move(currentSite, node.id)
    setSiteLabel("Fetching site data...")
    setDescriptionLabel("")
    setIcon("");

    if (!data.explored) {
      const explorationData = await explore(node)
      Object.assign(node.data, explorationData)
    }

    setSiteLabel(node.id)
    setDescriptionLabel(data.description)
    setIcon(data.image);

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
  const [similarSites, description, image] = await Promise.all([
    fetchSimilarSites(node.id),
    fetchDescription(node.id),
    fetchImage(node.id),
  ])
  data.similarSites = similarSites
  data.description = description
  data.image = image

  for (const site of similarSites) {
    if (!hasNode(site)) {
      addNode(site, {
        explored: false
      })
      exploreQueue.push(graph.getNode(site))
    }
    if (!hasLink(node.id, site)) {
      addLink(node.id, site)
    }
  }

  renderer.stable(false)
  clearTimeout(stabalizeTimeout)
  stabalizeTimeout = setTimeout(() => {
    renderer.stable(true)
  }, TIME_TO_STABALIZE_IN_MS)
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

async function fetchImage(site) {
  if (site === '') {
    throw new Error("fetchImage called with empty site")
  }
  try {
    const response = await fetch(`/image?site=${encodeURIComponent(site)}`)
    console.log(response)
    const {
      image
    } = await response.json()
    return image;
  } catch (err) {
    return "Sorry, we couldn't find an image for this site!" // image is a "nice to have"
  }
}