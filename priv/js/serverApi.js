'use strict';

module.exports = {
  fetchDescription,
  fetchImage,
  fetchSimilarSites,
}

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
