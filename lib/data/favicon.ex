require Logger

defmodule Data.Favicon do
  use Agent

  @name __MODULE__

  def start_link([]) do
    Agent.start_link(fn ->
      {:ok, @name} = Util.PersistentCache.load(@name)
      :ok
    end)
  end

  def get_site_image(url) do
    case Util.PersistentCache.get(@name, url) do
      nil ->
        update_cache_and_return_image(url)

      image ->
        Logger.info("Serving '#{url}' - Image - from cache")
        image
    end
  end

  defp update_cache_and_return_image(url) do
    Logger.info("Cache miss - '#{url}' - Image - Fetching.")

    case get_image(url) do
      {:ok, image} ->
        Util.PersistentCache.put(@name, url, image)
        image

      {:error, error_message} ->
        Logger.info("Failed to find image for '#{url}'")
        error_message
    end
  end

  defp get_image(url) do
    case FetchFavicon.fetch(url) do
      {:ok, image} ->
        {:ok, image}

      _ ->
        {:error, "Failed to find suitable image"}
    end
  end
end
