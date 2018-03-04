// Graph Setup
const graph = require('ngraph.graph')();
const renderGraph = require('ngraph.pixel');

const sites = new Set()

function addNode(id, data) {
  sites.add(id)
  graph.addNode(id, data)
}

function addLink(fromId, toId, data) {
  graph.addLink(fromId, toId, data)
}

// Initialization
const siteName = location.hash && location.hash.slice(1) || "google.com"
addNode(siteName, {
  explored: false
})

const renderer = renderGraph(graph, {
  node(node) {
    return {
      color: 0xFFFFFF,
      size: 20,
    };
  }
});


// renderer.on('nodehover', nodehoverHandler);
renderer.on('nodeclick', nodeclickHandler);

function nodehoverHandler(node) {
  if (node) {
    console.log(JSON.stringify(node))
  }
}

async function nodeclickHandler(node) {
  if (node) {
    const {
      data,
    } = node

    if (data.explored) {
      return; // already explored, do nothing
    }

    const explorationData = await explore(node)

    const nodeUI = renderer.getNode(node.id);
    nodeUI.color = 0xFB0000; // update node color
    nodeUI.size = 30; // update size

    Object.assign(data, explorationData)
  }
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
    addNode(site, {
      explored: false
    })
    addLink(node.id, site)
  }

  renderer.stable(false)
  renderer.redraw()

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
    return "" // description is a "nice to have"
  }
}
