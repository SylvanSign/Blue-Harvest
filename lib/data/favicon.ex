require Logger

defmodule Data.Favicon do
  use Agent

  @name __MODULE__
  @user_agent_pls_no_fbi "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0"
  @timeout_ms 100_000

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
    search_url = "https://www.google.com/s2/favicons?domain=#{url}"

    case HTTPoison.get(
           search_url,
           %{"User-Agent" => @user_agent_pls_no_fbi},
           recv_timeout: @timeout_ms,
           follow_redirect: true
         ) do
      {:ok, content} ->
        image = Map.get(content, :body)
        {:ok, image}

      _ ->
        {:error, "Failed to find suitable image"}
    end
  end
end
